"use client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Activity, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

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
            <div style={{
                background: 'white',
                borderRadius: 16,
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            }}>
                <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

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
                background: 'linear-gradient(135deg, #eff6ff, white)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    }}>
                        <Activity size={24} color="white" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>Status Stok</h3>
                        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Kesehatan inventory (<span style={{ fontWeight: 600, color: '#3b82f6' }}>{total}</span> item)</p>
                    </div>
                </div>
                <span style={{
                    padding: '6px 14px',
                    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: 'white',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                }}>
                    STATUS
                </span>
            </div>

            {total === 0 ? (
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
                        <Activity size={36} color="#94a3b8" />
                    </div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: '#475569', margin: 0 }}>Belum Ada Data</p>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: '8px 0 0 0' }}>Tambahkan stok untuk melihat status</p>
                </div>
            ) : (
                <div style={{ padding: 20 }}>
                    <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={70}
                                tick={{ fontSize: 13, fontWeight: 600, fill: '#475569' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                formatter={(value: number) => [`${value} item`, "Jumlah"]}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: 12,
                                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                    padding: '12px 16px',
                                }}
                            />
                            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>

                    {/* Status Summary Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 12,
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: '1px solid #f1f5f9',
                    }}>
                        <div style={{
                            padding: 16,
                            background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
                            borderRadius: 12,
                            textAlign: 'center',
                            border: '1px solid #a7f3d0',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                                <CheckCircle size={16} color="#059669" />
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#065f46', textTransform: 'uppercase' }}>Aman</span>
                            </div>
                            <p style={{ fontSize: 28, fontWeight: 800, color: '#059669', margin: 0 }}>{aman}</p>
                        </div>
                        <div style={{
                            padding: 16,
                            background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                            borderRadius: 12,
                            textAlign: 'center',
                            border: '1px solid #fcd34d',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                                <AlertTriangle size={16} color="#d97706" />
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#92400e', textTransform: 'uppercase' }}>Menipis</span>
                            </div>
                            <p style={{ fontSize: 28, fontWeight: 800, color: '#d97706', margin: 0 }}>{menipis}</p>
                        </div>
                        <div style={{
                            padding: 16,
                            background: 'linear-gradient(135deg, #fef2f2, #fecaca)',
                            borderRadius: 12,
                            textAlign: 'center',
                            border: '1px solid #fca5a5',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                                <XCircle size={16} color="#dc2626" />
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#991b1b', textTransform: 'uppercase' }}>Habis</span>
                            </div>
                            <p style={{ fontSize: 28, fontWeight: 800, color: '#dc2626', margin: 0 }}>{habis}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
