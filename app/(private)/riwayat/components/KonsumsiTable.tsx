"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Activity, Coffee, Pill } from "lucide-react";

type KonsumsiItem = {
    balita_id: string;
    nama_balita: string;
    nik: string;
    jk: string;
    tgl_lahir: string;
    kec: string;
    puskesmas: string;
    desa_kel: string;
    tanggal_konsumsi_awal: string;
    weeks: any;
    status_intervensi: string;
    current_week: number;
};

export function KonsumsiTable({ data }: { data: KonsumsiItem[] }) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRow = (balitaId: string) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(balitaId)) {
            newSet.delete(balitaId);
        } else {
            newSet.add(balitaId);
        }
        setExpandedRows(newSet);
    };

    const getComplianceColor = (percent: number) => {
        if (percent >= 80) return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white';
        if (percent >= 50) return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white';
        return 'bg-gradient-to-r from-red-500 to-rose-600 text-white';
    };

    return (
        <div className="rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200 px-4 py-3">
                <div className="grid grid-cols-13 gap-2 items-center text-xs font-bold text-gray-700">
                    <div className="col-span-1">No</div>
                    <div className="col-span-2">Nama Balita / NIK</div>
                    <div className="col-span-1 text-center">JK</div>
                    <div className="col-span-2">Lokasi</div>
                    <div className="col-span-2 text-center">Kepatuhan</div>
                    <div className="col-span-2 text-center">Kesehatan</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-1 text-center">Aksi</div>
                </div>
            </div>

            <div className="divide-y divide-gray-200">
                {data.map((item, idx) => {
                    const isExpanded = expandedRows.has(item.balita_id);
                    const latestWeek = item.weeks[item.current_week] || {};

                    return (
                        <div key={item.balita_id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                            {/* Row Header (Always Visible) */}
                            <div
                                className="bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 cursor-pointer transition-colors"
                                onClick={() => toggleRow(item.balita_id)}
                            >
                                <div className="grid grid-cols-13 gap-2 px-4 py-3 items-center text-sm">
                                    <div className="col-span-1 flex items-center gap-2">
                                        {isExpanded ? <ChevronDown size={18} className="text-emerald-600" /> : <ChevronRight size={18} className="text-gray-400" />}
                                        <span className="font-semibold text-gray-600">{idx + 1}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="font-bold text-gray-900">{item.nama_balita}</div>
                                        <div className="text-xs text-gray-500">{item.nik}</div>
                                    </div>
                                    <div className="col-span-1 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-semibold text-xs">
                                            {item.jk}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-gray-600 text-xs">
                                        <div>{item.kec}</div>
                                        <div className="font-medium">{item.desa_kel}</div>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-md ${getComplianceColor(latestWeek.kepatuhan_persen || 0)}`}>
                                            {latestWeek.kepatuhan_persen || 0}% Week {item.current_week}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${latestWeek.status_kesehatan === 'sehat'
                                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                            : 'bg-red-100 text-red-700 border border-red-300'
                                            }`}>
                                            {latestWeek.status_kesehatan || '-'}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${item.status_intervensi === "Intervensi Selesai"
                                            ? 'bg-gradient-to-r from-emerald-600 to-green-700 text-white'
                                            : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                                            }`}>
                                            {item.status_intervensi === "Intervensi Selesai" ? "Selesai" : "Proses"}
                                        </span>
                                    </div>
                                    <div className="col-span-1 flex items-center gap-1 justify-center ml-2" onClick={(e) => e.stopPropagation()}>
                                        <Link
                                            href={`/monitoring/${item.balita_id}/antropometri/new`}
                                            title="Antropometri"
                                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors inline-block"
                                        >
                                            <Activity size={14} />
                                        </Link>
                                        <Link
                                            href={`/monitoring/${item.balita_id}/konsumsi/new`}
                                            title="Konsumsi"
                                            className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors inline-block"
                                        >
                                            <Coffee size={14} />
                                        </Link>
                                        <Link
                                            href={`/monitoring/${item.balita_id}/pemberian/new`}
                                            title="Pemberian"
                                            className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors inline-block"
                                        >
                                            <Pill size={14} />
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="bg-gray-50/50 p-4 border-t border-gray-200">
                                    <div className="mb-3 text-xs text-gray-600">
                                        Tanggal Konsumsi Awal: <strong>{item.tanggal_konsumsi_awal ? new Date(item.tanggal_konsumsi_awal).toLocaleDateString('id-ID') : '-'}</strong>
                                    </div>

                                    {/* Week Data Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {[...Array(13)].map((_, weekIdx) => {
                                            const weekNum = weekIdx; // Week 0 = Awal, Week 1-12
                                            const weekData = item.weeks[weekNum];

                                            if (!weekData) return null;

                                            return (
                                                <div key={weekNum} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-bold text-gray-700">
                                                            {weekNum === 0 ? 'Awal' : `Week ${weekNum}`}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {weekData.tanggal_konsumsi && new Date(weekData.tanggal_konsumsi).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-600">Kepatuhan:</span>
                                                            <span className={`px-2 py-1 rounded text-xs font-bold ${getComplianceColor(weekData.kepatuhan_persen || 0)}`}>
                                                                {weekData.kepatuhan_persen || 0}%
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-600">Kesehatan:</span>
                                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${weekData.status_kesehatan === 'sehat'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {weekData.status_kesehatan || '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
