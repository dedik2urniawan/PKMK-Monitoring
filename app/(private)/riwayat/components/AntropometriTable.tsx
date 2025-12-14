"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Activity, Coffee, Pill, Eye } from "lucide-react";

type AntropometriItem = {
    bal

    ita_id: string;
    nama_balita: string;
    nik: string;
    jk: string;
    tgl_lahir: string;
    kec: string;
    puskesmas: string;
    desa_kel: string;
    tanggal_pengukuran_awal: string;
    weeks: any;
    status_intervensi: string;
    current_week: number;
};

export function AntropometriTable({ data }: { data: AntropometriItem[] }) {
    const [selectedBalita, setSelectedBalita] = useState<AntropometriItem | null>(null);
    const [expandedWeeks, setExpandedWeeks] = useState<number[]>([1]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleWeek = (week: number) => {
        if (expandedWeeks.includes(week)) {
            setExpandedWeeks(expandedWeeks.filter(w => w !== week));
        } else {
            setExpandedWeeks([...expandedWeeks, week]);
        }
    };

    const getLatestData = (item: AntropometriItem) => {
        const week = item.current_week || 1;
        return item.weeks[week] || {};
    };

    return (
        <>
            {/* Summary Table */}
            <div className="overflow-x-auto rounded-xl border-2 border-gray-200 shadow-sm">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">No</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">Nama Balita</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">NIK</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200">JK</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">Kec</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">Puskesmas</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">Desa/Kel</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200">Week Terakhir</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200">BB Terakhir</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200">TB Terakhir</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200">Status Intervensi</th>
                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data.map((item, idx) => {
                            const latest = getLatestData(item);
                            return (
                                <tr key={item.balita_id} className="hover:bg-emerald-50/30 transition-colors duration-150 even:bg-gray-50/50">
                                    <td className="px-4 py-3">{idx + 1}</td>
                                    <td className="px-4 py-3 font-semibold text-gray-900">{item.nama_balita}</td>
                                    <td className="px-4 py-3 text-gray-600">{item.nik || '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-semibold text-xs">
                                            {item.jk}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{item.kec}</td>
                                    <td className="px-4 py-3 text-gray-600">{item.puskesmas}</td>
                                    <td className="px-4 py-3 text-gray-600">{item.desa_kel}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                            Week {item.current_week}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center font-semibold">{latest.bb ? `${latest.bb} kg` : '-'}</td>
                                    <td className="px-4 py-3 text-center font-semibold">{latest.tb ? `${latest.tb} cm` : '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${item.status_intervensi === "Intervensi Selesai"
                                            ? 'bg-gradient-to-r from-emerald-600 to-green-700 text-white'
                                            : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                                            }`}>
                                            {item.status_intervensi}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2 justify-center">
                                            <button
                                                onClick={() => setSelectedBalita(item)}
                                                title="Lihat Detail"
                                                className="p-2 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <Link
                                                href={`/monitoring/${item.balita_id}/antropometri/new`}
                                                title="Antropometri"
                                                className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors inline-block"
                                            >
                                                <Activity size={16} />
                                            </Link>
                                            <Link
                                                href={`/monitoring/${item.balita_id}/konsumsi/new`}
                                                title="Konsumsi PKMK"
                                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors inline-block"
                                            >
                                                <Coffee size={16} />
                                            </Link>
                                            <Link
                                                href={`/monitoring/${item.balita_id}/pemberian/new`}
                                                title="Pemberian PKMK"
                                                className="p-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors inline-block"
                                            >
                                                <Pill size={16} />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal - EXACT PATTERN FROM MONITORING PKMK (WORKING!) */}
            {mounted && selectedBalita && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    zIndex: 99999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}
                    onClick={() => setSelectedBalita(null)}
                >
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '30px',
                        maxWidth: '900px',
                        width: '100%',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        position: 'relative'
                    }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                                    Detail Riwayat - Antropometri
                                </h2>
                                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                                    {selectedBalita.nama_balita} • NIK: {selectedBalita.nik}
                                </p>
                            </div>
                            <button onClick={() => setSelectedBalita(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Status Badge */}
                        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: selectedBalita.status_intervensi === "Intervensi Selesai" ? '#d1fae5' : '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
                            <strong>{selectedBalita.status_intervensi}</strong>
                        </div>

                        {/* Week-by-Week Data */}
                        <div style={{ marginTop: '20px' }}>
                            {[...Array(12)].map((_, idx) => {
                                const weekNum = idx + 1;
                                const weekData = selectedBalita.weeks[weekNum];
                                if (!weekData) return null;
                                const isExpanded = expandedWeeks.includes(weekNum);

                                return (
                                    <div key={weekNum} style={{ marginBottom: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                                        <button
                                            onClick={() => toggleWeek(weekNum)}
                                            style={{
                                                width: '100%',
                                                background: 'linear-gradient(to right, #f9fafb, #f3f4f6)',
                                                padding: '12px 16px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {isExpanded ? <ChevronDown size={20} color="#059669" /> : <ChevronRight size={20} color="#9ca3af" />}
                                                <span style={{ fontWeight: 'bold' }}>Week {weekNum}</span>
                                                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                                    {weekData.tanggal_pengukuran && new Date(weekData.tanggal_pengukuran).toLocaleDateString('id-ID')}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                                                <span>BB: <strong>{weekData.bb} kg</strong></span>
                                                <span>TB: <strong>{weekData.tb} cm</strong></span>
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div style={{ padding: '16px', backgroundColor: 'white', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                                                <div style={{ padding: '12px', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '500', marginBottom: '4px' }}>Berat Badan (BB)</div>
                                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a' }}>{weekData.bb} kg</div>
                                                    {weekData.delta_bb !== undefined && (
                                                        <div style={{ fontSize: '12px', color: weekData.delta_bb >= 0 ? '#059669' : '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                            {weekData.delta_bb >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                            {weekData.delta_bb >= 0 ? '+' : ''}{weekData.delta_bb.toFixed(2)} kg
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{ padding: '12px', backgroundColor: '#f3e8ff', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: '500', marginBottom: '4px' }}>Tinggi Badan (TB)</div>
                                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#5b21b6' }}>{weekData.tb} cm</div>
                                                    {weekData.delta_tb !== undefined && (
                                                        <div style={{ fontSize: '12px', color: weekData.delta_tb >= 0 ? '#059669' : '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                            {weekData.delta_tb >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                            {weekData.delta_tb >= 0 ? '+' : ''}{weekData.delta_tb.toFixed(2)} cm
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '12px', color: '#b45309', fontWeight: '500', marginBottom: '4px' }}>ZS-BBU</div>
                                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#78350f' }}>{weekData.zs_bbu?.toFixed(2) || '-'}</div>
                                                </div>

                                                <div style={{ padding: '12px', backgroundColor: '#d1fae5', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '12px', color: '#047857', fontWeight: '500', marginBottom: '4px' }}>ZS-TBU</div>
                                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#065f46' }}>{weekData.zs_tbu?.toFixed(2) || '-'}</div>
                                                </div>

                                                <div style={{ padding: '12px', backgroundColor: '#ffe4e6', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '12px', color: '#be123c', fontWeight: '500', marginBottom: '4px' }}>ZS-BBTB</div>
                                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#9f1239' }}>{weekData.zs_bbtb?.toFixed(2) || '-'}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                            <button
                                onClick={() => setSelectedBalita(null)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: '#4b5563',
                                    color: 'white',
                                    borderRadius: '8px',
                                    border: 'none',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
