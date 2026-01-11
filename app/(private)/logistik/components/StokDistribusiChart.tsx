"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Package } from "lucide-react";

interface StokMerkData {
    name: string;
    value: number;
    percentage: number;
    [key: string]: string | number;
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
            <div style={{
                background: 'white',
                borderRadius: 16,
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            }}>
                <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const hasData = data && data.length > 0 && total > 0;

    return (
        <div style={{
            background: 'white',
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}>
            {/* Header */}
            <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(135deg, #ecfdf5, white)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    }}>
                        <Package size={24} color="white" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Distribusi Stok per Merk</h3>
                        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Total: <span style={{ fontWeight: 600, color: '#10b981' }}>{total.toLocaleString()}</span> kotak</p>
                    </div>
                </div>
                <span style={{
                    padding: '6px 14px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                }}>
                    DISTRIBUSI
                </span>
            </div>

            {!hasData ? (
                <div style={{
                    height: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(180deg, #f8fafc, white)',
                }}>
                    <div style={{
                        width: 80,
                        height: 80,
                        background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
                        borderRadius: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                    }}>
                        <Package size={36} color="#94a3b8" />
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: '#475569', margin: 0 }}>Belum Ada Data</p>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: '8px 0 0 0' }}>Tambahkan stok untuk melihat distribusi</p>
                </div>
            ) : (
                <div style={{ padding: 20 }}>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={90}
                                paddingAngle={3}
                                dataKey="value"
                                label={({ percentage }: any) => `${percentage}%`}
                                labelLine={false}
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number, name: string, props: any) => [
                                    `${value.toLocaleString()} kotak (${props.payload.percentage}%)`,
                                    name
                                ]}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 12,
                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                    padding: '12px 16px',
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 12,
                        justifyContent: 'center',
                        marginTop: 12,
                        padding: '12px 0',
                        borderTop: '1px solid #f1f5f9',
                    }}>
                        {data.map((item, index) => (
                            <div key={item.name} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 12px',
                                background: '#f8fafc',
                                borderRadius: 8,
                            }}>
                                <div style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    background: COLORS[index % COLORS.length],
                                    boxShadow: `0 0 0 3px ${COLORS[index % COLORS.length]}20`,
                                }} />
                                <span style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
                                    {item.name} <span style={{ color: '#64748b' }}>({item.value.toLocaleString()})</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
