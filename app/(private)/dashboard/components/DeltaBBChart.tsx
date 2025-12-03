"use client";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Scale, Info } from "lucide-react";

interface WeekData {
    week: string;
    [key: string]: number | string;
}

interface LocationLine {
    id: string;
    name: string;
    color: string;
}

interface DeltaBBChartProps {
    data: WeekData[];
    locations: LocationLine[];
    expectedBaseline: number;
    loading?: boolean;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function DeltaBBChart({
    data,
    locations,
    expectedBaseline,
    loading = false,
}: DeltaBBChartProps) {
    const [selectedLines, setSelectedLines] = useState<string[]>([]);

    // Sync selectedLines with locations prop and filter out locations with no data
    useEffect(() => {
        if (locations && locations.length > 0 && data && data.length > 0) {
            const locationsWithData = locations.filter(loc => {
                return data.some(row => row[loc.name] !== null && row[loc.name] !== undefined);
            });
            setSelectedLines(locationsWithData.map(loc => loc.name));
        }
    }, [locations, data]);

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
    const hasLocations = locations && locations.length > 0;

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                    <Scale className="text-white" size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">Perubahan Berat Badan (ΔBB)</h3>
                    <p className="text-sm text-gray-600">Tracking kenaikan BB per minggu vs target minimal (5gr/kg BB)</p>
                </div>
            </div>

            {(!hasData || !hasLocations) ? (
                <div className="h-96 flex flex-col items-center justify-center text-gray-500">
                    <Scale size={48} className="mb-4 opacity-30" />
                    <p className="text-lg font-semibold">Tidak Ada Data</p>
                    <p className="text-sm mt-2">Belum ada data monitoring untuk bulan yang dipilih</p>
                    <p className="text-xs mt-1 text-gray-400">Data: {data?.length || 0} | Lokasi: {locations?.length || 0}</p>
                </div>
            ) : (
                <>
                    <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                        <div className="flex items-start gap-2">
                            <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-800">
                                <strong>Target:</strong> Kenaikan BB minimal <strong>5 gram per kg berat badan</strong> per minggu.
                            </div>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '14px', fontWeight: 500 }} />
                            <YAxis stroke="#6b7280" style={{ fontSize: '14px', fontWeight: 500 }} />
                            <Tooltip contentStyle={{ backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '8px' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />

                            <ReferenceLine y={expectedBaseline} stroke="#9ca3af" strokeDasharray="8 4" strokeWidth={2} label={`Target: ${(expectedBaseline * 1000).toFixed(0)}gr`} />

                            {locations.map((location, idx) => (
                                selectedLines.includes(location.name) && (
                                    <Line key={location.id} type="monotone" dataKey={location.name} stroke={COLORS[idx % COLORS.length]} strokeWidth={3} dot={{ fill: COLORS[idx % COLORS.length], r: 4 }} />
                                )
                            ))}
                        </LineChart>
                    </ResponsiveContainer>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-semibold text-gray-700">Interpretasi: Di atas target = Sangat Baik | Mendekati = Baik | Di bawah = Perlu Perhatian</p>
                    </div>
                </>
            )}
        </div>
    );
}
