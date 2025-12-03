"use client";
import { Users, CheckCircle, TrendingUp } from "lucide-react";

interface ComplianceScorecardProps {
    totalBalita: number;
    kohortInput: number;
    compliancePercentage: number;
    loading?: boolean;
}

export default function ComplianceScorecard({
    totalBalita,
    kohortInput,
    compliancePercentage,
    loading = false,
}: ComplianceScorecardProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-200 rounded-xl h-32"></div>
                ))}
            </div>
        );
    }

    const getComplianceColor = () => {
        if (compliancePercentage >= 75) return "from-green-500 to-green-600";
        if (compliancePercentage >= 50) return "from-yellow-500 to-yellow-600";
        return "from-red-500 to-red-600";
    };

    const getComplianceTextColor = () => {
        if (compliancePercentage >= 75) return "text-green-700";
        if (compliancePercentage >= 50) return "text-yellow-700";
        return "text-red-700";
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Total Balita */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                        <Users className="text-white" size={24} />
                    </div>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">{totalBalita.toLocaleString()}</div>
                <div className="text-sm font-medium text-gray-600">Total Balita</div>
                <div className="text-xs text-gray-500 mt-1">Stunting + Red Flag</div>
            </div>

            {/* Kohort Input */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-md">
                        <CheckCircle className="text-white" size={24} />
                    </div>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">{kohortInput.toLocaleString()}</div>
                <div className="text-sm font-medium text-gray-600">Kohort Terinput</div>
                <div className="text-xs text-gray-500 mt-1">Data kohort pertama</div>
            </div>

            {/* Compliance Percentage */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getComplianceColor()} flex items-center justify-center shadow-md`}>
                        <TrendingUp className="text-white" size={24} />
                    </div>
                </div>
                <div className={`text-3xl font-bold mb-1 ${getComplianceTextColor()}`}>
                    {compliancePercentage.toFixed(1)}%
                </div>
                <div className="text-sm font-medium text-gray-600">Tingkat Compliance</div>
                <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full bg-gradient-to-r ${getComplianceColor()} transition-all duration-500`}
                            style={{ width: `${Math.min(compliancePercentage, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
