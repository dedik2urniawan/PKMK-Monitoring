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

    const getComplianceColor = () => {
        if (compliancePercentage >= 75) return "#22c55e";
        if (compliancePercentage >= 50) return "#eab308";
        return "#ef4444";
    };

    return (
        <>
            <style jsx>{`
                .scorecard-grid {
                    display: grid;
                    grid-template-columns: repeat(1, 1fr);
                    gap: 20px;
                }
                @media (min-width: 768px) {
                    .scorecard-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }
                .card {
                    background: white;
                    padding: 24px;
                    border-radius: 12px;
                    border: 1px solid #f3f4f6;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .card-label {
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #638884;
                }
                .card-row {
                    display: flex;
                    align-items: flex-end;
                    justify-content: space-between;
                }
                .card-value {
                    font-size: 36px;
                    font-weight: 900;
                    color: #111817;
                }
                .card-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 9999px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .card-icon.blue {
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                }
                .card-icon.green {
                    background: rgba(34, 197, 94, 0.1);
                    color: #22c55e;
                }
                .card-icon.teal {
                    background: rgba(20, 184, 166, 0.1);
                    color: #14b8a6;
                }
                .card-hint {
                    font-size: 12px;
                    color: #9ca3af;
                    margin-top: 8px;
                }
                .compliance-card {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .compliance-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .compliance-value {
                    font-size: 36px;
                    font-weight: 900;
                    margin-top: 4px;
                }
                .progress-container {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .progress-bar {
                    width: 100%;
                    height: 10px;
                    background: #f3f4f6;
                    border-radius: 9999px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    border-radius: 9999px;
                    transition: width 0.5s ease;
                }
                .progress-label {
                    font-size: 12px;
                    color: #9ca3af;
                    text-align: right;
                }
            `}</style>

            <div className="scorecard-grid">
                {/* Total Balita */}
                <div className="card">
                    <p className="card-label">Total Balita</p>
                    <div className="card-row">
                        <p className="card-value">{totalBalita.toLocaleString()}</p>
                        <div className="card-icon blue">
                            <Users size={18} />
                        </div>
                    </div>
                    <p className="card-hint">Terdaftar dalam program</p>
                </div>

                {/* Kohort Terinput */}
                <div className="card">
                    <p className="card-label">Kohort Terinput</p>
                    <div className="card-row">
                        <p className="card-value">{kohortInput.toLocaleString()}</p>
                        <div className="card-icon green">
                            <CheckCircle size={18} />
                        </div>
                    </div>
                    <p className="card-hint">Data lengkap bulan ini</p>
                </div>

                {/* Tingkat Compliance */}
                <div className="card compliance-card">
                    <div className="compliance-header">
                        <div>
                            <p className="card-label">Tingkat Compliance</p>
                            <p
                                className="compliance-value"
                                style={{ color: getComplianceColor() }}
                            >
                                {compliancePercentage.toFixed(1)}%
                            </p>
                        </div>
                        <div className="card-icon teal">
                            <TrendingUp size={18} />
                        </div>
                    </div>
                    <div className="progress-container">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${Math.min(compliancePercentage, 100)}%`,
                                    backgroundColor: getComplianceColor()
                                }}
                            />
                        </div>
                        <p className="progress-label">Target: 85%</p>
                    </div>
                </div>
            </div>
        </>
    );
}
