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
            <>
                <style jsx>{`
                    .loading-grid {
                        display: grid;
                        grid-template-columns: repeat(1, 1fr);
                        gap: 20px;
                    }
                    @media (min-width: 768px) {
                        .loading-grid {
                            grid-template-columns: repeat(3, 1fr);
                        }
                    }
                    .loading-card {
                        background: #e5e7eb;
                        border-radius: 12px;
                        height: 140px;
                        animation: pulse 2s infinite;
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                `}</style>
                <div className="loading-grid">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="loading-card" />
                    ))}
                </div>
            </>
        );
    }

    const cards = [
        {
            title: "Antropometri",
            icon: Ruler,
            value: data?.antropometri?.monitored || 0,
            percentage: data?.antropometri?.percentage || 0,
            color: "#3b82f6",
            bgColor: "rgba(59, 130, 246, 0.1)",
            badge: "W1",
            badgeBg: "rgba(59, 130, 246, 0.1)",
            badgeColor: "#1d4ed8",
        },
        {
            title: "Konsumsi",
            icon: Utensils,
            value: data?.konsumsi?.monitored || 0,
            percentage: data?.konsumsi?.percentage || 0,
            color: "#8b5cf6",
            bgColor: "rgba(139, 92, 246, 0.1)",
            badge: "Daily",
            badgeBg: "rgba(139, 92, 246, 0.1)",
            badgeColor: "#6d28d9",
        },
        {
            title: "Pemberian",
            icon: Pill,
            value: data?.pemberian?.monitored || 0,
            percentage: data?.pemberian?.percentage || 0,
            color: "#f59e0b",
            bgColor: "rgba(245, 158, 11, 0.1)",
            badge: "Stock",
            badgeBg: "rgba(245, 158, 11, 0.1)",
            badgeColor: "#b45309",
        },
    ];

    return (
        <>
            <style jsx>{`
                .monitoring-grid {
                    display: grid;
                    grid-template-columns: repeat(1, 1fr);
                    gap: 20px;
                }
                @media (min-width: 768px) {
                    .monitoring-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }
                .progress-card {
                    background: white;
                    padding: 24px;
                    border-radius: 12px;
                    border: 1px solid #f3f4f6;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .card-title {
                    font-size: 18px;
                    font-weight: 700;
                    color: #111817;
                }
                .card-badge {
                    font-size: 12px;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 4px;
                }
                .card-stats {
                    display: flex;
                    align-items: flex-end;
                    gap: 8px;
                }
                .card-percentage {
                    font-size: 30px;
                    font-weight: 900;
                    color: #111817;
                }
                .card-fraction {
                    font-size: 14px;
                    font-weight: 500;
                    color: #638884;
                    margin-bottom: 6px;
                }
                .progress-bar {
                    width: 100%;
                    height: 12px;
                    background: #f3f4f6;
                    border-radius: 9999px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    border-radius: 9999px;
                    transition: width 0.5s ease;
                }
            `}</style>

            <div className="monitoring-grid">
                {cards.map((card, index) => (
                    <div key={index} className="progress-card">
                        <div className="card-header">
                            <p className="card-title">{card.title}</p>
                            <span
                                className="card-badge"
                                style={{
                                    background: card.badgeBg,
                                    color: card.badgeColor
                                }}
                            >
                                {card.badge}
                            </span>
                        </div>
                        <div className="card-stats">
                            <span className="card-percentage">{card.percentage.toFixed(1)}%</span>
                            <span className="card-fraction">({card.value}/{totalBalita})</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${Math.min(card.percentage, 100)}%`,
                                    backgroundColor: card.color
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}
