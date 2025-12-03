"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { AlertTriangle } from "lucide-react";

interface RedFlagData {
    name: string;
    value: number;
    percentage: number;
    [key: string]: string | number; // Index signature for Recharts compatibility
}

interface RedFlagPieChartProps {
    data: RedFlagData[];
    totalWithRedFlag: number;
    loading?: boolean;
}

const COLORS = ["#ef4444", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4"];

export default function RedFlagPieChart({
    data,
    totalWithRedFlag,
    loading = false,
}: RedFlagPieChartProps) {
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

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
                    <AlertTriangle className="text-white" size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Distribusi Red Flag</h3>
                    <p className="text-sm text-gray-600">
                        Persentase jenis red flag terdeteksi ({totalWithRedFlag} kasus)
                    </p>
                </div>
            </div>

            {/* Empty State */}
            {!hasData ? (
                <div className="h-96 flex flex-col items-center justify-center text-gray-500">
                    <AlertTriangle size={48} className="mb-4 opacity-30" />
                    <p className="text-lg font-semibold">Tidak Ada Red Flag</p>
                    <p className="text-sm mt-2">Tidak ada red flag terdeteksi pada periode ini</p>
                </div>
            ) : (
                <>
                    {/* Pie Chart */}
                    <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percentage }: any) => `${name}: ${percentage}%`}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number, name: string, props: any) => [
                                    `${value} kasus (${props.payload.percentage}%)`,
                                    name,
                                ]}
                                contentStyle={{
                                    backgroundColor: "white",
                                    border: "2px solid #e5e7eb",
                                    borderRadius: "8px",
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                formatter={(value: any, entry: any) => (
                                    <span className="text-sm">
                                        {value} ({entry.payload.value})
                                    </span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Summary */}
                    <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
                        <p className="text-xs font-semibold text-red-800">
                            Total {totalWithRedFlag} balita terdeteksi memiliki minimal 1 red flag
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
