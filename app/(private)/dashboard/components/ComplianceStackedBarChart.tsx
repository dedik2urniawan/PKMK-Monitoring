"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { ChevronLeft } from "lucide-react";

interface ComplianceStackedBarChartProps {
    title: string;
    data: any[];
    type: 'antropometri' | 'konsumsi' | 'pemberian';
    loading?: boolean;
}

export default function ComplianceStackedBarChart({
    title,
    data,
    type,
    loading = false,
}: ComplianceStackedBarChartProps) {
    const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const hasData = data && data.length > 0;

    // Determine what to display based on drill-down state
    let displayData: any[] = [];
    let chartTitle = title;
    let canDrillDown = false;

    if (selectedLocation) {
        const parent = data.find(d => d.id === selectedLocation);
        if (parent && parent.children) {
            displayData = parent.children.map((child: any) => ({
                name: child.name,
                monitored: child[type]?.monitored || 0,
                notMonitored: (child.totalBalita || 0) - (child[type]?.monitored || 0),
                percentage: child[type]?.percentage || 0,
                total: child.totalBalita || 0,
            }));
            chartTitle = `${title} - ${parent.name}`;
        }
    } else {
        displayData = data.map((loc: any) => ({
            name: loc.name,
            monitored: loc[type]?.monitored || 0,
            notMonitored: (loc.totalBalita || 0) - (loc[type]?.monitored || 0),
            percentage: loc[type]?.percentage || 0,
            total: loc.totalBalita || 0,
            hasChildren: loc.children && loc.children.length > 0,
            id: loc.id,
        }));
        canDrillDown = displayData.some(d => d.hasChildren);
    }

    // Improved click handler - attaches to Bar/Cell
    const handleBarClick = (data: any) => {
        // Recharts payload structure can vary, check both direct data and payload
        const item = data?.payload || data;

        if (item && item.hasChildren && !selectedLocation) {
            setSelectedLocation(item.id);
        }
    };

    const handleBack = () => {
        setSelectedLocation(null);
    };

    const getBarColor = (percentage: number) => {
        if (percentage >= 80) return "#10b981"; // Green
        if (percentage >= 60) return "#f59e0b"; // Yellow
        return "#ef4444"; // Red
    };

    // Calculate dynamic height based on number of items
    const chartHeight = Math.max(300, displayData.length * 50);

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex flex-col" style={{ minHeight: '500px' }}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">{chartTitle}</h3>
                    <p className="text-sm text-gray-600">
                        {selectedLocation ? "Detail per Desa" : "Detail per Puskesmas"}
                    </p>
                </div>
                {selectedLocation && (
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <ChevronLeft size={16} /> Kembali
                    </button>
                )}
            </div>

            {!hasData ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 min-h-[300px]">
                    <p>Tidak ada data tersedia</p>
                </div>
            ) : (
                <div style={{ minHeight: '400px', height: 'auto', position: 'relative' }}>
                    <ResponsiveContainer width="100%" height={Math.max(400, chartHeight)}>
                        <BarChart
                            layout="vertical"
                            data={displayData}
                            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={90}
                                tick={{ fontSize: 12, fontWeight: 500 }}
                                interval={0}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                }}
                                formatter={(value: number, name: string, props: any) => {
                                    if (name === 'monitored') return [`${value} Balita (${props.payload.percentage.toFixed(1)}%)`, 'Sudah Monitor'];
                                    return [`${value} Balita`, 'Belum Monitor'];
                                }}
                                labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                            />
                            <Legend
                                verticalAlign="top"
                                height={36}
                                formatter={(value) => value === 'monitored' ? 'Sudah Monitor' : 'Belum Monitor'}
                            />
                            {/* Attach onClick directly to Bar and Cells for better hit testing */}
                            <Bar
                                dataKey="monitored"
                                stackId="a"
                                fill="#10b981"
                                barSize={30}
                                onClick={handleBarClick}
                                style={{ cursor: canDrillDown && !selectedLocation ? 'pointer' : 'default' }}
                            >
                                {displayData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={getBarColor(entry.percentage)}
                                        cursor={canDrillDown && !selectedLocation ? 'pointer' : 'default'}
                                    />
                                ))}
                            </Bar>
                            <Bar
                                dataKey="notMonitored"
                                stackId="a"
                                fill="#e5e7eb"
                                barSize={30}
                                onClick={handleBarClick}
                                style={{ cursor: canDrillDown && !selectedLocation ? 'pointer' : 'default' }}
                            >
                                {displayData.map((entry, index) => (
                                    <Cell
                                        key={`cell-nm-${index}`}
                                        cursor={canDrillDown && !selectedLocation ? 'pointer' : 'default'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {canDrillDown && !selectedLocation && (
                <p className="text-xs text-center text-gray-500 mt-4">
                    Klik pada bar untuk melihat detail per desa
                </p>
            )}
        </div>
    );
}
