"use client";
import { Ruler, Utensils, Pill } from "lucide-react";

interface ComplianceData {
    monitored: number;
    percentage: number;
}

interface MonitoringComplianceScorecardProps {
    totalBalita: number;
    data: {
        antropometri: ComplianceData;
        konsumsi: ComplianceData;
        pemberian: ComplianceData;
    };
    loading?: boolean;
}

export default function MonitoringComplianceScorecard({
    totalBalita,
    data,
    loading = false,
}: MonitoringComplianceScorecardProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-32 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                ))}
            </div>
        );
    }

    const getStatusColor = (percentage: number) => {
        if (percentage >= 80) return "text-green-600 bg-green-50 border-green-200";
        if (percentage >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    const getProgressBarColor = (percentage: number) => {
        if (percentage >= 80) return "bg-green-500";
        if (percentage >= 60) return "bg-yellow-500";
        return "bg-red-500";
    };

    const cards = [
        {
            title: "Monitoring Antropometri",
            icon: Ruler,
            value: data?.antropometri?.monitored || 0,
            percentage: data?.antropometri?.percentage || 0,
            description: "Balita diukur",
        },
        {
            title: "Monitoring Konsumsi",
            icon: Utensils,
            value: data?.konsumsi?.monitored || 0,
            percentage: data?.konsumsi?.percentage || 0,
            description: "Balita dicatat konsumsi",
        },
        {
            title: "Monitoring Pemberian",
            icon: Pill,
            value: data?.pemberian?.monitored || 0,
            percentage: data?.pemberian?.percentage || 0,
            description: "Balita dicatat pemberian",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className={`rounded-xl shadow-sm border p-4 transition-all duration-200 hover:shadow-md ${getStatusColor(card.percentage)} bg-white`}
                    style={{ backgroundColor: 'white' }} // Override bg color to white, keep text/border colors
                >
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600">{card.title}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {card.percentage.toFixed(1)}%
                                </h3>
                                <span className="text-sm text-gray-500">
                                    ({card.value}/{totalBalita})
                                </span>
                            </div>
                        </div>
                        <div className={`p-2 rounded-lg ${getStatusColor(card.percentage)} bg-opacity-20`}>
                            <card.icon size={20} />
                        </div>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
                        <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${getProgressBarColor(card.percentage)}`}
                            style={{ width: `${Math.min(card.percentage, 100)}%` }}
                        ></div>
                    </div>

                    <p className="text-xs text-gray-500">
                        {card.description} dari total {totalBalita} balita
                    </p>
                </div>
            ))}
        </div>
    );
}
