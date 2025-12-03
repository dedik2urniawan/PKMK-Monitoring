"use client";
import { Activity, TrendingDown, TrendingUp, AlertTriangle, Scale } from "lucide-react";

interface NutritionScorecardProps {
    avgBBU: number;
    avgTBU: number;
    avgBBTB: number;
    avgDeltaBB: number;
    redFlagPercentage: number;
    loading?: boolean;
}

export default function NutritionScorecard({
    avgBBU,
    avgTBU,
    avgBBTB,
    avgDeltaBB,
    redFlagPercentage,
    loading = false,
}: NutritionScorecardProps) {
    if (loading) {
        return (
            <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-gray-200 rounded-xl h-32"></div>
                    ))}
                </div>
                <div className="bg-gray-200 rounded-xl h-20 animate-pulse"></div>
            </div>
        );
    }

    const getZScoreColor = (score: number) => {
        if (score >= -1) return "text-green-700";
        if (score >= -2) return "text-yellow-700";
        return "text-red-700";
    };

    const getZScoreGradient = (score: number) => {
        if (score >= -1) return "from-green-500 to-green-600";
        if (score >= -2) return "from-yellow-500 to-yellow-600";
        return "from-red-500 to-red-600";
    };

    return (
        <div className="space-y-4 mb-6">
            {/* Main Metrics - 4 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Avg BBU */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                        <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${getZScoreGradient(avgBBU)} flex items-center justify-center shadow-md`}>
                            <Scale className="text-white" size={22} />
                        </div>
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${getZScoreColor(avgBBU)}`}>
                        {avgBBU.toFixed(2)}
                    </div>
                    <div className="text-sm font-semibold text-gray-700">Rata-rata Z-Score</div>
                    <div className="text-xs text-gray-600 mt-1">BB/U (Berat/Umur)</div>
                </div>

                {/* Avg TBU */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                        <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${getZScoreGradient(avgTBU)} flex items-center justify-center shadow-md`}>
                            <Activity className="text-white" size={22} />
                        </div>
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${getZScoreColor(avgTBU)}`}>
                        {avgTBU.toFixed(2)}
                    </div>
                    <div className="text-sm font-semibold text-gray-700">Rata-rata Z-Score</div>
                    <div className="text-xs text-gray-600 mt-1">TB/U (Tinggi/Umur)</div>
                </div>

                {/* Avg BBTB */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                        <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${getZScoreGradient(avgBBTB)} flex items-center justify-center shadow-md`}>
                            <TrendingDown className="text-white" size={22} />
                        </div>
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${getZScoreColor(avgBBTB)}`}>
                        {avgBBTB.toFixed(2)}
                    </div>
                    <div className="text-sm font-semibold text-gray-700">Rata-rata Z-Score</div>
                    <div className="text-xs text-gray-600 mt-1">BB/TB (Berat/Tinggi)</div>
                </div>

                {/* Avg Delta BB */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                        <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${avgDeltaBB >= 0 ? "from-blue-500 to-blue-600" : "from-orange-500 to-orange-600"} flex items-center justify-center shadow-md`}>
                            <TrendingUp className="text-white" size={22} />
                        </div>
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${avgDeltaBB >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                        {avgDeltaBB >= 0 ? "+" : ""}{avgDeltaBB.toFixed(3)} kg
                    </div>
                    <div className="text-sm font-semibold text-gray-700">Rata-rata ΔBB</div>
                    <div className="text-xs text-gray-600 mt-1">Perubahan Berat Badan</div>
                </div>
            </div>

            {/* Red Flags Banner */}
            <div className={`rounded-xl shadow-md p-5 border-2 ${redFlagPercentage > 20
                    ? "bg-red-50 border-red-300"
                    : redFlagPercentage > 10
                        ? "bg-yellow-50 border-yellow-300"
                        : "bg-green-50 border-green-300"
                }`}>
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center shadow-md ${redFlagPercentage > 20
                            ? "bg-gradient-to-br from-red-500 to-red-600"
                            : redFlagPercentage > 10
                                ? "bg-gradient-to-br from-yellow-500 to-yellow-600"
                                : "bg-gradient-to-br from-green-500 to-green-600"
                        }`}>
                        <AlertTriangle className="text-white" size={28} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-baseline gap-3">
                            <span className={`text-3xl font-bold ${redFlagPercentage > 20
                                    ? "text-red-700"
                                    : redFlagPercentage > 10
                                        ? "text-yellow-700"
                                        : "text-green-700"
                                }`}>
                                {redFlagPercentage.toFixed(1)}%
                            </span>
                            <span className="text-lg font-semibold text-gray-700">Red Flags Terdeteksi</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                            {redFlagPercentage > 20
                                ? "⚠️ Tingkat red flag tinggi - perlu perhatian segera"
                                : redFlagPercentage > 10
                                    ? "⚠️ Tingkat red flag sedang - monitoring diperlukan"
                                    : "✓ Tingkat red flag rendah - kondisi terkendali"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
