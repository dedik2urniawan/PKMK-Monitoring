"use client";
import { useState } from "react";
import { Calendar, Filter, Download } from "lucide-react";

interface FilterSectionProps {
    onFilterChange: (year: number, month: number) => void;
    onExport?: () => void;
    selectedYear?: number;
    selectedMonth?: number;
}

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

const MONTHS = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
];

const YEARS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) => 2020 + i);

export default function FilterSection({
    onFilterChange,
    onExport,
    selectedYear: initialYear,
    selectedMonth: initialMonth
}: FilterSectionProps) {
    const [selectedYear, setSelectedYear] = useState(initialYear || CURRENT_YEAR);
    const [selectedMonth, setSelectedMonth] = useState(initialMonth || CURRENT_MONTH);

    const handleApply = () => {
        onFilterChange(selectedYear, selectedMonth);
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                    <Filter className="text-white" size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Filter Periode</h3>
                    <p className="text-sm text-gray-600">Pilih tahun dan bulan untuk melihat analisis</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Calendar size={14} className="inline mr-1" />
                        Tahun
                    </label>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-white font-medium"
                    >
                        {YEARS.map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Calendar size={14} className="inline mr-1" />
                        Bulan
                    </label>
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none bg-white font-medium"
                    >
                        {MONTHS.map((month) => (
                            <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleApply}
                    className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                    <Filter size={18} />
                    Terapkan Filter
                </button>

                {onExport && (
                    <button
                        onClick={onExport}
                        className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                    >
                        <Download size={18} />
                        Export PDF
                    </button>
                )}
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                    <span className="font-semibold">Periode aktif:</span> {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}
                    <span className="text-blue-600 ml-2">(Data agregat dari awal sampai periode ini)</span>
                </p>
            </div>
        </div>
    );
}
