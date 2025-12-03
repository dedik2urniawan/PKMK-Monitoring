"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, ChevronDown, ChevronUp } from "lucide-react";

interface WeekData {
    week: string;
    [key: string]: number | string;
}

interface LocationLine {
    id: string;
    name: string;
    color: string;
    children?: LocationLine[];
}

interface ZScoreLineChartProps {
    title: string;
    subtitle: string;
    data: WeekData[];
    locations: LocationLine[];
    loading?: boolean;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

export default function ZScoreLineChart({
    title,
    subtitle,
    data,
    locations,
    loading = false,
}: ZScoreLineChartProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [selectedLines, setSelectedLines] = useState<string[]>([]);

    // Sync selectedLines with locations prop and filter out locations with no data
    useEffect(() => {
        if (locations && locations.length > 0 && data && data.length > 0) {
            // Filter locations that have at least one non-null value in data
            const locationsWithData = locations.filter(loc => {
                return data.some(row => row[loc.name] !== null && row[loc.name] !== undefined);
            });
            setSelectedLines(locationsWithData.map(loc => loc.name));
        }
    }, [locations, data]);

    const handleLocationClick = (location: LocationLine) => {
        if (location.children && location.children.length > 0) {
            if (expandedId === location.id) {
                setExpandedId(null);
                const childNames = location.children.map((c) => c.name);
                setSelectedLines(selectedLines.filter((name) => !childNames.includes(name)));
            } else {
                setExpandedId(location.id);
                const childNames = location.children.map((c) => c.name);
                setSelectedLines([...selectedLines, ...childNames]);
            }
        }
    };

    const toggleLine = (lineName: string) => {
        if (selectedLines.includes(lineName)) {
            setSelectedLines(selectedLines.filter((name) => name !== lineName));
        } else {
            setSelectedLines([...selectedLines, lineName]);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                <div className="h-96 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    // Check if data is empty
    const hasData = data && data.length > 0;
    const hasLocations = locations && locations.length > 0;

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                    <TrendingUp className="text-white" size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    <p className="text-sm text-gray-600">{subtitle}</p>
                </div>
            </div>

            {/* Empty State */}
            {(!hasData || !hasLocations) ? (
                <div className="h-96 flex flex-col items-center justify-center text-gray-500">
                    <TrendingUp size={48} className="mb-4 opacity-30" />
                    <p className="text-lg font-semibold">Tidak Ada Data</p>
                    <p className="text-sm mt-2">Belum ada data monitoring untuk bulan yang dipilih</p>
                    <p className="text-xs mt-1 text-gray-400">Data: {data?.length || 0} | Lokasi: {locations?.length || 0}</p>
                </div>
            ) : (
                <>
                    {/* Chart */}
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '14px', fontWeight: 500 }} />
                            <YAxis domain={[-4, 2]} stroke="#6b7280" style={{ fontSize: '14px', fontWeight: 500 }} />
                            <Tooltip contentStyle={{ backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '8px' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} onClick={(e) => e.value && toggleLine(e.value)} iconType="line" />

                            <ReferenceLine y={-2} stroke="#f59e0b" strokeDasharray="5 5" label="-2 SD" />
                            <ReferenceLine y={-3} stroke="#ef4444" strokeDasharray="5 5" label="-3 SD" />

                            {locations.map((location, idx) => (
                                selectedLines.includes(location.name) && (
                                    <Line key={location.id} type="monotone" dataKey={location.name} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={{ fill: COLORS[idx % COLORS.length], r: 4 }} />
                                )
                            ))}
                        </LineChart>
                    </ResponsiveContainer>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-semibold text-gray-700">Interpretasi: &gt; -1 SD: Normal | -2 to -1: Kurang | &lt; -2: Buruk</p>
                    </div>
                </>
            )}
        </div>
    );
}
