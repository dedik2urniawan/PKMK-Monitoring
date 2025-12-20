"use client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Activity } from "lucide-react";

interface StatusData {
    name: string;
    value: number;
    color: string;
}

interface StokStatusChartProps {
    aman: number;
    menipis: number;
    habis: number;
    loading?: boolean;
}

export default function StokStatusChart({ aman, menipis, habis, loading = false }: StokStatusChartProps) {
    const data: StatusData[] = [
        { name: "Aman", value: aman, color: "#059669" },
        { name: "Menipis", value: menipis, color: "#f59e0b" },
        { name: "Habis", value: habis, color: "#dc2626" }
    ];

    const total = aman + menipis + habis;

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <Activity className="text-white" size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Status Stok</h3>
                    <p className="text-sm text-gray-600">Kesehatan inventory ({total} item)</p>
                </div>
            </div>

            {total === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                    <Activity size={48} className="mb-4 opacity-30" />
                    <p className="text-lg font-semibold">Belum Ada Data</p>
                </div>
            ) : (
                <>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 14, fontWeight: 600 }} />
                            <Tooltip
                                formatter={(value: number) => [`${value} item`, "Jumlah"]}
                                contentStyle={{ backgroundColor: "white", border: "2px solid #e5e7eb", borderRadius: "8px" }}
                            />
                            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Legend Summary */}
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                            <p className="text-2xl font-bold text-emerald-700">{aman}</p>
                            <p className="text-xs text-emerald-600">Aman</p>
                        </div>
                        <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-2xl font-bold text-amber-700">{menipis}</p>
                            <p className="text-xs text-amber-600">Menipis</p>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-2xl font-bold text-red-700">{habis}</p>
                            <p className="text-xs text-red-600">Habis</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
