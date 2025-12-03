"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Heart } from "lucide-react";

interface HealthData {
    id: string;
    name: string;
    sehat: number;
    sakit: number;
    sehatPercentage: number;
    sakitPercentage: number;
    children?: HealthData[];
}

interface HealthStatusBarChartProps {
    data: HealthData[];
    loading?: boolean;
}

export default function HealthStatusBarChart({
    data,
    loading = false,
}: HealthStatusBarChartProps) {
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
    let title = "Status Kesehatan Balita";

    if (selectedLocation) {
        const parent = data.find(d => d.id === selectedLocation);
        if (parent && parent.children) {
            displayData = parent.children.map(child => ({
                name: child.name,
                sehat: child.sehatPercentage,
                sakit: child.sakitPercentage,
            }));
            title = `Status Kesehatan - ${parent.name}`;
        }
    } else {
        displayData = data.map(loc => ({
            name: loc.name,
            sehat: loc.sehatPercentage,
            sakit: loc.sakitPercentage,
            hasChildren: loc.children && loc.children.length > 0,
            id: loc.id,
        }));
    }

    const canDrillDown = displayData.some(d => d.hasChildren);

    const handleBarClick = (data: any) => {
        if (data && data.activePayload && data.activePayload[0]) {
            const payload = data.activePayload[0].payload;
            if (payload.hasChildren) {
                setSelectedLocation(payload.id);
            }
        }
    };

    const handleBack = () => {
        setSelectedLocation(null);
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-md">
                    <Heart className="text-white" size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    <p className="text-sm text-gray-600">Distribusi status sehat vs sakit per lokasi</p>
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
                    <Heart size={48} className="mb-4 opacity-30" />
                    <p className="text-lg font-semibold">Tidak Ada Data</p>
                    <p className="text-sm mt-2">Belum ada data status kesehatan untuk periode ini</p>
                </div>
            ) : (
                <>
                    {/* Stacked Bar Chart */}
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }} onClick={handleBarClick}>
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
                                label={{ value: 'Persentase (%)', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                }}
                                formatter={(value: number, name: string) => [
                                    `${value.toFixed(1)}%`,
                                    name === 'sehat' ? 'Sehat' : 'Sakit'
                                ]}
                            />
                            <Legend
                                formatter={(value) => value === 'sehat' ? 'Sehat' : 'Sakit'}
                                wrapperStyle={{ paddingTop: '20px' }}
                            />
                            <Bar dataKey="sehat" stackId="a" fill="#10b981" />
                            <Bar dataKey="sakit" stackId="a" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Info */}
                    <div className="mt-4 p-3 bg-pink-50 border-l-4 border-pink-500 rounded">
                        <p className="text-xs font-semibold text-pink-800">
                            Status kesehatan berdasarkan catatan monitoring konsumsi
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
