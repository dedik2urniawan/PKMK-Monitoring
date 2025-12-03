"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Building2, MapPin } from "lucide-react";

interface LocationData {
    id: string;
    name: string;
    percentage: number;
    total: number;
    kohort: number;
    children?: LocationData[];
}

interface ComplianceDrilldownChartProps {
    data: LocationData[];
    level: "puskesmas" | "desa";
    loading?: boolean;
}

export default function ComplianceDrilldownChart({
    data,
    level,
    loading = false,
}: ComplianceDrilldownChartProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const getColor = (percentage: number) => {
        if (percentage >= 75) return "#10b981";
        if (percentage >= 50) return "#f59e0b";
        return "#ef4444";
    };

    const handleBarClick = (entry: LocationData) => {
        if (entry.children && entry.children.length > 0) {
            setExpandedId(expandedId === entry.id ? null : entry.id);
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

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-md">
                    {level === "puskesmas" ? <Building2 className="text-white" size={20} /> : <MapPin className="text-white" size={20} />}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800">
                        Compliance by {level === "puskesmas" ? "Puskesmas" : "Desa"}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {level === "puskesmas" ? "Klik untuk melihat breakdown per desa" : "Detail compliance per desa"}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {data.map((location) => (
                    <div key={location.id}>
                        <div
                            className={`bg-gray-50 rounded-lg p-4 border-2 transition-all ${expandedId === location.id ? "border-blue-400 shadow-md" : "border-gray-200 hover:border-gray-300"
                                } ${location.children && location.children.length > 0 ? "cursor-pointer" : ""}`}
                            onClick={() => handleBarClick(location)}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-800">{location.name}</span>
                                    {location.children && location.children.length > 0 && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                            {expandedId === location.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                        </span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span
                                        className={`text-lg font-bold ${location.percentage >= 75 ? "text-green-700" : location.percentage >= 50 ? "text-yellow-700" : "text-red-700"
                                            }`}
                                    >
                                        {location.percentage.toFixed(1)}%
                                    </span>
                                    <span className="text-xs text-gray-600 ml-2">
                                        ({location.kohort}/{location.total})
                                    </span>
                                </div>
                            </div>

                            <div className="relative w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                                <div
                                    className="h-full flex items-center justify-end pr-3 text-white font-semibold text-sm transition-all duration-500"
                                    style={{
                                        width: `${Math.max(location.percentage, 5)}%`,
                                        backgroundColor: getColor(location.percentage),
                                    }}
                                >
                                    {location.percentage > 10 && `${location.percentage.toFixed(1)}%`}
                                </div>
                            </div>
                        </div>

                        {expandedId === location.id && location.children && location.children.length > 0 && (
                            <div className="ml-8 mt-2 space-y-2 border-l-4 border-blue-200 pl-4">
                                {location.children.map((child) => (
                                    <div key={child.id} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-blue-600" />
                                                <span className="font-medium text-gray-700">{child.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span
                                                    className={`text-base font-bold ${child.percentage >= 75 ? "text-green-700" : child.percentage >= 50 ? "text-yellow-700" : "text-red-700"
                                                        }`}
                                                >
                                                    {child.percentage.toFixed(1)}%
                                                </span>
                                                <span className="text-xs text-gray-600 ml-2">
                                                    ({child.kohort}/{child.total})
                                                </span>
                                            </div>
                                        </div>

                                        <div className="relative w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                                            <div
                                                className="h-full transition-all duration-500"
                                                style={{
                                                    width: `${Math.max(child.percentage, 3)}%`,
                                                    backgroundColor: getColor(child.percentage),
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500"></div>
                    <span className="text-sm text-gray-600">Baik (≥75%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500"></div>
                    <span className="text-sm text-gray-600">Sedang (50-74%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500"></div>
                    <span className="text-sm text-gray-600">Rendah (&lt;50%)</span>
                </div>
            </div>
        </div>
    );
}
