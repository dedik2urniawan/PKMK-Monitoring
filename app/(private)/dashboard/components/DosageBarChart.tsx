"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Droplet } from "lucide-react";

interface DosageData {
    id: string;
    name: string;
    avgDosage: number;
    children?: DosageData[];
}

interface DosageBarChartProps {
    data: DosageData[];
    loading?: boolean;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function DosageBarChart({
    data,
    loading = false,
}: DosageBarChartProps) {
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
    let title = "Rata-rata Dosis PKMK";

    if (selectedLocation) {
        const parent = data.find(d => d.id === selectedLocation);
        if (parent && parent.children) {
            displayData = parent.children.map(child => ({
                name: child.name,
                value: child.avgDosage,
            }));
            title = `Dosis PKMK - ${parent.name}`;
        }
    } else {
        displayData = data.map(loc => ({
            name: loc.name,
            value: loc.avgDosage,
            hasChildren: loc.children && loc.children.length > 0,
            id: loc.id,
        }));
    }

    const canDrillDown = displayData.some(d => d.hasChildren);

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
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-md">
                    <Droplet className="text-white" size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    <p className="text-sm text-gray-600">Rata-rata dosis pemberian PKMK (ml) per lokasi</p>
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
                    <Droplet size={48} className="mb-4 opacity-30" />
                    <p className="text-lg font-semibold">Tidak Ada Data</p>
                    <p className="text-sm mt-2">Belum ada data pemberian PKMK untuk periode ini</p>
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
                                label={{ value: 'Dosis (ml)', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                }}
                                formatter={(value: number) => [`${value.toFixed(1)} ml`, 'Rata-rata Dosis']}
                            />
                            <Bar
                                dataKey="value"
                                fill="#06b6d4"
                                onClick={handleBarClick}
                                cursor={canDrillDown && !selectedLocation ? 'pointer' : 'default'}
                            >
                                {displayData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Info */}
                    <div className="mt-4 p-3 bg-cyan-50 border-l-4 border-cyan-500 rounded">
                        <p className="text-xs font-semibold text-cyan-800">
                            Dosis rata-rata pemberian PKMK per lokasi dalam satuan ml
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
