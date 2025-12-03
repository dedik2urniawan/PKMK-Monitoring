"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { TrendingUp, ChevronRight } from "lucide-react";

interface LocationData {
    id: string;
    name: string;
    avgKepatuhan: number;
    children?: LocationData[];
}

interface KepatuhanBarChartProps {
    data: LocationData[];
    loading?: boolean;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function KepatuhanBarChart({
    data,
    loading = false,
}: KepatuhanBarChartProps) {
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="h-96 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    const hasData = data && data.length > 0;

    // Determine what to display
    let displayData: any[] = [];
    let canDrillDown = false;
    let title = "Tingkat Kepatuhan Konsumsi PKMK";

    if (selectedLocation) {
        const parent = data.find(d => d.id === selectedLocation);
        if (parent && parent.children) {
            displayData = parent.children.map(child => ({
                name: child.name,
                value: child.avgKepatuhan,
            }));
            title = `Kepatuhan - ${parent.name}`;
        }
    } else {
        displayData = data.map(loc => ({
            name: loc.name,
            value: loc.avgKepatuhan,
            hasChildren: loc.children && loc.children.length > 0,
            id: loc.id,
        }));
        canDrillDown = displayData.some(d => d.hasChildren);
    }

    const handleBarClick = (data: any) => {
        if (data && data.hasChildren) {
            setSelectedLocation(data.id);
        }
    };

    const handleBack = () => {
        setSelectedLocation(null);
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                    <TrendingUp className="text-white" size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    <p className="text-sm text-gray-600">Persentase kepatuhan konsumsi per lokasi</p>
                </div>
                {selectedLocation && (
                    <button
                        onClick={handleBack}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        ← Kembali
                    </button>
                )}
            </div>

            {/* Empty State */}
            {!hasData ? (
                <div className="h-96 flex flex-col items-center justify-center text-gray-500">
                    <TrendingUp size={48} className="mb-4 opacity-30" />
                    <p className="text-lg font-semibold">Tidak Ada Data</p>
                    <p className="text-sm mt-2">Belum ada data kepatuhan untuk periode ini</p>
                </div>
            ) : (
                <>
                    {/* Bar Chart */}
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="name"
                                stroke="#6b7280"
                                style={{ fontSize: '12px', fontWeight: 500 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis
                                stroke="#6b7280"
                                style={{ fontSize: '14px', fontWeight: 500 }}
                                label={{ value: 'Kepatuhan (%)', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                }}
                                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Kepatuhan']}
                            />
                            <ReferenceLine y={80} stroke="#10b981" strokeDasharray="5 5" label="Target 80%" />
                            <Bar
                                dataKey="value"
                                fill="#3b82f6"
                                onClick={handleBarClick}
                                cursor={canDrillDown && !selectedLocation ? 'pointer' : 'default'}
                            >
                                {displayData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.value >= 80 ? '#10b981' : entry.value >= 60 ? '#f59e0b' : '#ef4444'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Info */}
                    <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                        <p className="text-xs font-semibold text-blue-800">
                            Target: ≥80% (Baik) | 60-79% (Cukup) | &lt;60% (Perlu Perhatian)
                            {canDrillDown && !selectedLocation && (
                                <span className="ml-2">• Klik bar untuk drill-down</span>
                            )}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
