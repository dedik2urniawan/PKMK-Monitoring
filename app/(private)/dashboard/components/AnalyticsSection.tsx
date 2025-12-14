"use client";
import { useState, useEffect, useCallback } from "react";
import FilterSection from "./FilterSection";
import ComplianceScorecard from "./ComplianceScorecard";
import ComplianceDrilldownChart from "./ComplianceDrilldownChart";
import NutritionScorecard from "./NutritionScorecard";
import ZScoreLineChart from "./ZScoreLineChart";
import DeltaBBChart from "./DeltaBBChart";
import RedFlagPieChart from "./RedFlagPieChart";
import KepatuhanBarChart from "./KepatuhanBarChart";
import HealthStatusBarChart from "./HealthStatusBarChart";
import DosageBarChart from "./DosageBarChart";
import MonitoringComplianceScorecard from "./MonitoringComplianceScorecard";
import ComplianceStackedBarChart from "./ComplianceStackedBarChart";
import { BarChart3, Heart, TrendingUp, CheckCircle2, Download } from "lucide-react";
import { exportAnalyticsToPDF } from "@/lib/exportAnalytics";

export default function AnalyticsSection() {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedWeek, setSelectedWeek] = useState<string>("all");

    const [complianceData, setComplianceData] = useState<any>(null);
    const [complianceLoading, setComplianceLoading] = useState(true);

    const [nutritionData, setNutritionData] = useState<any>(null);
    const [nutritionLoading, setNutritionLoading] = useState(true);

    const [redFlagData, setRedFlagData] = useState<any>(null);
    const [redFlagLoading, setRedFlagLoading] = useState(true);

    const [kepatuhanData, setKepatuhanData] = useState<any>(null);
    const [kepatuhanLoading, setKepatuhanLoading] = useState(true);

    const [dosageData, setDosageData] = useState<any>(null);
    const [dosageLoading, setDosageLoading] = useState(true);

    const [monitoringComplianceData, setMonitoringComplianceData] = useState<any>(null);
    const [monitoringComplianceLoading, setMonitoringComplianceLoading] = useState(true);

    const fetchComplianceData = async () => {
        setComplianceLoading(true);
        try {
            const response = await fetch(`/api/analytics/compliance?year=${selectedYear}&month=${selectedMonth}`);
            if (response.ok) {
                const data = await response.json();
                setComplianceData(data);
            }
        } catch (error) {
            console.error("Error fetching compliance data:", error);
        } finally {
            setComplianceLoading(false);
        }
    };

    const fetchNutritionData = async () => {
        setNutritionLoading(true);
        try {
            const response = await fetch(`/api/analytics/nutrition?year=${selectedYear}&month=${selectedMonth}`);
            if (response.ok) {
                const data = await response.json();
                setNutritionData(data);
            }
        } catch (error) {
            console.error("Error fetching nutrition data:", error);
        } finally {
            setNutritionLoading(false);
        }
    };

    const fetchRedFlagData = async () => {
        setRedFlagLoading(true);
        try {
            const response = await fetch(`/api/analytics/redflag?year=${selectedYear}&month=${selectedMonth}`);
            if (response.ok) {
                const data = await response.json();
                setRedFlagData(data);
            }
        } catch (error) {
            console.error("Error fetching red flag data:", error);
        } finally {
            setRedFlagLoading(false);
        }
    };

    const fetchKepatuhanData = async () => {
        setKepatuhanLoading(true);
        try {
            const response = await fetch(`/api/analytics/kepatuhan?year=${selectedYear}&month=${selectedMonth}`);
            if (response.ok) {
                const data = await response.json();
                setKepatuhanData(data);
            }
        } catch (error) {
            console.error("Error fetching kepatuhan data:", error);
        } finally {
            setKepatuhanLoading(false);
        }
    };

    const fetchDosageData = async () => {
        setDosageLoading(true);
        try {
            const response = await fetch(`/api/analytics/dosage?year=${selectedYear}&month=${selectedMonth}`);
            if (response.ok) {
                const data = await response.json();
                setDosageData(data);
            }
        } catch (error) {
            console.error("Error fetching dosage data:", error);
        } finally {
            setDosageLoading(false);
        }
    };

    const fetchMonitoringComplianceData = useCallback(async () => {
        setMonitoringComplianceLoading(true);
        try {
            const weekQuery = selectedWeek !== "all" ? `&week=${selectedWeek}` : "";
            const response = await fetch(`/api/analytics/monitoring-compliance?year=${selectedYear}&month=${selectedMonth}${weekQuery}`);
            if (response.ok) {
                const data = await response.json();
                setMonitoringComplianceData(data);
            }
        } catch (error) {
            console.error("Error fetching monitoring compliance data:", error);
        } finally {
            setMonitoringComplianceLoading(false);
        }
    }, [selectedYear, selectedMonth, selectedWeek]);

    useEffect(() => {
        fetchComplianceData();
        fetchNutritionData();
        fetchRedFlagData();
        fetchKepatuhanData();
        fetchDosageData();
    }, [selectedYear, selectedMonth]);

    useEffect(() => {
        fetchMonitoringComplianceData();
    }, [selectedYear, selectedMonth, selectedWeek, fetchMonitoringComplianceData]);

    const handleFilterChange = (year: number, month: number) => {
        setSelectedYear(year);
        setSelectedMonth(month);
    };

    const handleExport = () => {
        exportAnalyticsToPDF(complianceData, nutritionData, selectedYear, selectedMonth);
    };

    return (
        <div id="analytics-dashboard" className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard Analytics</h1>
                    <p className="text-gray-600">Overview kinerja program PKMK dan status gizi balita</p>
                </div>
                <div className="flex items-center gap-3">
                    <FilterSection
                        selectedYear={selectedYear}
                        selectedMonth={selectedMonth}
                        onFilterChange={handleFilterChange}
                    />
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <Download size={18} />
                        Export PDF
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-md">
                        <BarChart3 className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Analisis Compliance Kohort</h2>
                        <p className="text-sm text-gray-600">Tingkat kepatuhan input data kohort balita stunting</p>
                    </div>
                </div>

                <ComplianceScorecard
                    totalBalita={complianceData?.totalBalita || 0}
                    kohortInput={complianceData?.kohortInput || 0}
                    compliancePercentage={complianceData?.compliancePercentage || 0}
                    loading={complianceLoading}
                />

                <ComplianceDrilldownChart
                    data={complianceData?.groupedData || []}
                    level={complianceData?.level || "puskesmas"}
                    loading={complianceLoading}
                />
            </div>

            {/* Monitoring Compliance Section */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                            <CheckCircle2 className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Monitoring Compliance</h2>
                            <p className="text-sm text-gray-600">Kelengkapan monitoring Antropometri, Konsumsi, dan Pemberian</p>
                        </div>
                    </div>

                    {/* Week Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Filter Minggu:</span>
                        <select
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(e.target.value)}
                            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Semua Minggu</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => (
                                <option key={week} value={week}>Minggu ke-{week}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <MonitoringComplianceScorecard
                    totalBalita={monitoringComplianceData?.totalBalita || 0}
                    data={monitoringComplianceData?.overall || {}}
                    loading={monitoringComplianceLoading}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ComplianceStackedBarChart
                        title="Antropometri"
                        data={monitoringComplianceData?.byLocation || []}
                        type="antropometri"
                        loading={monitoringComplianceLoading}
                    />
                    <ComplianceStackedBarChart
                        title="Konsumsi"
                        data={monitoringComplianceData?.byLocation || []}
                        type="konsumsi"
                        loading={monitoringComplianceLoading}
                    />
                    <ComplianceStackedBarChart
                        title="Pemberian"
                        data={monitoringComplianceData?.byLocation || []}
                        type="pemberian"
                        loading={monitoringComplianceLoading}
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-md">
                        <Heart className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Analisis Status Gizi</h2>
                        <p className="text-sm text-gray-600">Monitoring perkembangan status gizi balita PKMK</p>
                    </div>
                </div>

                <NutritionScorecard
                    avgBBU={nutritionData?.avgBBU || 0}
                    avgTBU={nutritionData?.avgTBU || 0}
                    avgBBTB={nutritionData?.avgBBTB || 0}
                    avgDeltaBB={nutritionData?.avgDeltaBB || 0}
                    redFlagPercentage={nutritionData?.redFlagPercentage || 0}
                    loading={nutritionLoading}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <ZScoreLineChart
                        title="Z-Score BB/U"
                        subtitle="Berat Badan menurut Umur"
                        data={nutritionData?.chartDataBBU || []}
                        locations={nutritionData?.locations || []}
                        loading={nutritionLoading}
                    />
                    <ZScoreLineChart
                        title="Z-Score TB/U"
                        subtitle="Tinggi Badan menurut Umur"
                        data={nutritionData?.chartDataTBU || []}
                        locations={nutritionData?.locations || []}
                        loading={nutritionLoading}
                    />
                    <ZScoreLineChart
                        title="Z-Score BB/TB"
                        subtitle="Berat Badan menurut Tinggi Badan"
                        data={nutritionData?.chartDataBBTB || []}
                        locations={nutritionData?.locations || []}
                        loading={nutritionLoading}
                    />
                </div>

                <DeltaBBChart
                    data={nutritionData?.chartDataDeltaBB || []}
                    locations={nutritionData?.locations || []}
                    expectedBaseline={nutritionData?.expectedBaseline || 0.25}
                    loading={nutritionLoading}
                />

                {/* Red Flag Pie Chart */}
                <RedFlagPieChart
                    data={redFlagData?.redFlagDistribution || []}
                    totalWithRedFlag={redFlagData?.totalWithRedFlag || 0}
                    loading={redFlagLoading}
                />
            </div>

            {/* Analisis Kepatuhan Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                        <TrendingUp className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Analisis Kepatuhan</h2>
                        <p className="text-sm text-gray-600">Monitoring kepatuhan konsumsi dan status kesehatan balita</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <KepatuhanBarChart
                        data={kepatuhanData?.kepatuhanByLocation || []}
                        loading={kepatuhanLoading}
                    />
                    <HealthStatusBarChart
                        data={kepatuhanData?.healthByLocation || []}
                        loading={kepatuhanLoading}
                    />
                </div>

                <DosageBarChart
                    data={dosageData?.dosageByLocation || []}
                    loading={dosageLoading}
                />
            </div>
        </div>
    );
}
