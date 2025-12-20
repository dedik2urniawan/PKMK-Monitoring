"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Package } from "lucide-react";

interface StokMerkData {
    name: string;
    value: number;
    percentage: number;
    [key: string]: string | number; // Index signature for Recharts compatibility
}

interface StokDistribusiChartProps {
    data: StokMerkData[];
    total: number;
    loading?: boolean;
}

const COLORS = ["#059669", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6"];

export default function StokDistribusiChart({ data, total, loading = false }: StokDistribusiChartProps) {
    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
            </div>
        );
    }

    const hasData = data && data.length > 0 && total > 0;

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                    <Package className="text-white" size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Distribusi Stok per Merk</h3>
                    <p className="text-sm text-gray-600">Total: {total.toLocaleString()} kotak</p>
                </div>
            </div>

            {!hasData ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                    <Package size={48} className="mb-4 opacity-30" />
                    <p className="text-lg font-semibold">Belum Ada Data</p>
                    <p className="text-sm mt-2">Tambahkan stok untuk melihat distribusi</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ percentage }: any) => `${percentage}%`}
                            labelLine={false}
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number, name: string, props: any) => [
                                `${value.toLocaleString()} kotak (${props.payload.percentage}%)`,
                                name
                            ]}
                            contentStyle={{ backgroundColor: "white", border: "2px solid #e5e7eb", borderRadius: "8px" }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            formatter={(value: string, entry: any) => (
                                <span className="text-xs">{value} ({entry.payload.value.toLocaleString()})</span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
