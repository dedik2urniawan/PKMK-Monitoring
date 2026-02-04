"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, Coffee, Pill, ChevronDown, ChevronRight, X, Ruler, Droplets, Calendar, UtensilsCrossed, HandHeart } from "lucide-react";

type PemberianItem = {
    balita_id: string;
    nama_balita: string;
    nik: string;
    jk: string;
    tgl_lahir: string;
    kec: string;
    puskesmas: string;
    desa_kel: string;
    tanggal_pemberian_awal: string;
    weeks: any;
    status_intervensi: string;
    current_week: number;
};

function getInitials(name: string | null): string {
    if (!name) return "?";
    const parts = name.split(" ").filter(p => p.length > 0);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

export function PemberianTable({ data }: { data: PemberianItem[] }) {
    const [selectedBalita, setSelectedBalita] = useState<PemberianItem | null>(null);
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

    const getLatestData = (item: PemberianItem) => {
        const week = item.current_week || 1;
        return item.weeks[week] || {};
    };

    const getTotalDosis = (weeks: any) => {
        return Object.values(weeks).reduce((sum: number, w: any) => sum + (w?.jumlah_dosis_ml || 0), 0);
    };

    const getFilledWeeks = (weeks: any) => {
        return Object.values(weeks).filter((w: any) => w?.jumlah_dosis_ml).length;
    };

    return (
        <>
            <style jsx>{`
                .table-section {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .table-wrapper {
                    overflow-x: auto;
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }
                .data-table thead {
                    background: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                }
                .data-table th {
                    padding: 16px 20px;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #64748b;
                    white-space: nowrap;
                }
                .data-table tbody tr {
                    border-bottom: 1px solid #f1f5f9;
                    transition: background 0.15s;
                }
                .data-table tbody tr:hover {
                    background: rgba(139, 92, 246, 0.03);
                }
                .data-table td {
                    padding: 14px 20px;
                    font-size: 14px;
                    color: #475569;
                    vertical-align: middle;
                }
                .cell-name {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 9999px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 700;
                    text-transform: uppercase;
                    flex-shrink: 0;
                }
                .avatar.male {
                    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                    color: #1d4ed8;
                }
                .avatar.female {
                    background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
                    color: #be185d;
                }
                .name-text {
                    font-weight: 600;
                    color: #7c3aed;
                }
                .nik-text {
                    font-family: ui-monospace, monospace;
                    font-size: 12px;
                    color: #64748b;
                    margin-top: 2px;
                }
                .location-primary {
                    font-weight: 600;
                    color: #0f172a;
                    font-size: 13px;
                }
                .location-secondary {
                    font-size: 12px;
                    color: #64748b;
                    margin-top: 2px;
                }
                .week-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
                    border: 1px solid #d8b4fe;
                    border-radius: 9999px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #7c3aed;
                }
                .dosis-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .dosis-value {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 14px;
                    font-weight: 700;
                    color: #7c3aed;
                }
                .dosis-progress {
                    display: flex;
                    gap: 2px;
                }
                .dosis-bar {
                    width: 8px;
                    height: 16px;
                    border-radius: 2px;
                    background: #e2e8f0;
                }
                .dosis-bar.filled {
                    background: linear-gradient(180deg, #a855f7, #7c3aed);
                }
                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    padding: 5px 12px;
                    border-radius: 9999px;
                    font-size: 12px;
                    font-weight: 600;
                }
                .status-badge.complete {
                    background: #f0fdf4;
                    color: #166534;
                }
                .status-badge.progress {
                    background: #fef3c7;
                    color: #92400e;
                }
                .actions-cell {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    gap: 6px;
                }
                .action-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 8px;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    transition: all 0.15s;
                    text-decoration: none;
                }
                .action-btn.view {
                    background: #f1f5f9;
                    color: #475569;
                }
                .action-btn.view:hover {
                    background: #e2e8f0;
                    color: #1e293b;
                }
                .action-btn.blue {
                    background: #eff6ff;
                    color: #2563eb;
                }
                .action-btn.blue:hover {
                    background: #dbeafe;
                    color: #1d4ed8;
                }
                .action-btn.amber {
                    background: #fef3c7;
                    color: #d97706;
                }
                .action-btn.amber:hover {
                    background: #fde68a;
                    color: #b45309;
                }
                .action-btn.purple {
                    background: #faf5ff;
                    color: #9333ea;
                }
                .action-btn.purple:hover {
                    background: #f3e8ff;
                    color: #7c3aed;
                }
            `}</style>

            <div className="table-section">
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>NIK</th>
                                <th>Nama Balita</th>
                                <th>Lokasi</th>
                                <th style={{ textAlign: 'center' }}>Week</th>
                                <th>Total Dosis</th>
                                <th style={{ textAlign: 'center' }}>Progress</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => {
                                const latest = getLatestData(item);
                                const initials = getInitials(item.nama_balita);
                                const isMale = item.jk === 'L';
                                const totalDosis = getTotalDosis(item.weeks);
                                const filledWeeks = getFilledWeeks(item.weeks);

                                return (
                                    <tr key={item.balita_id}>
                                        <td>
                                            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px' }}>
                                                {item.nik || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="cell-name">
                                                <div className={`avatar ${isMale ? 'male' : 'female'}`}>
                                                    {initials}
                                                </div>
                                                <div>
                                                    <div className="name-text">{item.nama_balita}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="location-primary">{item.puskesmas}</div>
                                            <div className="location-secondary">{item.kec} • {item.desa_kel}</div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className="week-badge">
                                                Week {item.current_week}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="dosis-value">
                                                <Droplets size={16} />
                                                <span>{totalDosis} ml</span>
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                                {filledWeeks}/13 week tercatat
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="dosis-progress">
                                                {[...Array(13)].map((_, i) => {
                                                    const weekData = item.weeks[i];
                                                    const hasDosis = weekData?.jumlah_dosis_ml > 0;
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`dosis-bar ${hasDosis ? 'filled' : ''}`}
                                                            title={`${i === 0 ? 'Awal' : `Week ${i}`}: ${weekData?.jumlah_dosis_ml || 0} ml`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`status-badge ${item.status_intervensi === "Intervensi Selesai" ? 'complete' : 'progress'}`}>
                                                {item.status_intervensi === "Intervensi Selesai" ? "Selesai" : "Proses"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="actions-cell">
                                                <button
                                                    onClick={() => setSelectedBalita(item)}
                                                    title="Lihat Detail Pemberian"
                                                    className="action-btn view"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <Link
                                                    href={`/monitoring/${item.balita_id}/antropometri/new`}
                                                    title="Input Antropometri"
                                                    className="action-btn blue"
                                                >
                                                    <Ruler size={18} />
                                                </Link>
                                                <Link
                                                    href={`/monitoring/${item.balita_id}/konsumsi/new`}
                                                    title="Input Konsumsi"
                                                    className="action-btn amber"
                                                >
                                                    <UtensilsCrossed size={18} />
                                                </Link>
                                                <Link
                                                    href={`/monitoring/${item.balita_id}/pemberian/new`}
                                                    title="Input Pemberian PKMK"
                                                    className="action-btn purple"
                                                >
                                                    <HandHeart size={18} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {mounted && selectedBalita && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
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
                        borderRadius: '16px',
                        padding: '0',
                        maxWidth: '800px',
                        width: '100%',
                        maxHeight: '85vh',
                        overflow: 'hidden',
                        position: 'relative',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{
                            background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                            padding: '24px 28px',
                            color: 'white'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: selectedBalita.jk === 'L' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(236, 72, 153, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '16px',
                                        fontWeight: 700
                                    }}>
                                        {getInitials(selectedBalita.nama_balita)}
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{selectedBalita.nama_balita}</h2>
                                        <p style={{ fontSize: '13px', opacity: 0.85, margin: '4px 0 0 0' }}>
                                            NIK: {selectedBalita.nik} • {selectedBalita.puskesmas}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedBalita(null)}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.15)',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: 'white'
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Summary Stats in Header */}
                            <div style={{
                                marginTop: '16px',
                                display: 'flex',
                                gap: '16px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 14px',
                                    background: 'rgba(255,255,255,0.15)',
                                    borderRadius: '9999px',
                                    fontSize: '13px'
                                }}>
                                    <Droplets size={14} />
                                    Total: {getTotalDosis(selectedBalita.weeks)} ml
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 14px',
                                    background: 'rgba(255,255,255,0.15)',
                                    borderRadius: '9999px',
                                    fontSize: '13px'
                                }}>
                                    <Calendar size={14} />
                                    {getFilledWeeks(selectedBalita.weeks)}/13 week
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 14px',
                                    background: 'rgba(255,255,255,0.15)',
                                    borderRadius: '9999px',
                                    fontSize: '13px'
                                }}>
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: selectedBalita.status_intervensi === "Intervensi Selesai" ? '#86efac' : '#fde047'
                                    }} />
                                    {selectedBalita.status_intervensi === "Intervensi Selesai" ? "Selesai" : "Proses"}
                                </div>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '24px 28px', maxHeight: 'calc(85vh - 200px)', overflowY: 'auto' }}>
                            <h3 style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#0f172a',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Pill size={18} style={{ color: '#7c3aed' }} />
                                Riwayat Pemberian PKMK Mingguan
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[...Array(13)].map((_, idx) => {
                                    const weekNum = idx;
                                    const weekData = selectedBalita.weeks[weekNum];
                                    if (!weekData) return null;
                                    const isExpanded = expandedWeeks.includes(weekNum);
                                    const dosis = weekData.jumlah_dosis_ml || 0;

                                    return (
                                        <div key={weekNum} style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '10px',
                                            overflow: 'hidden',
                                            transition: 'border-color 0.2s',
                                            borderColor: isExpanded ? '#a855f7' : '#e2e8f0'
                                        }}>
                                            <button
                                                onClick={() => toggleWeek(weekNum)}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 18px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    background: isExpanded ? '#faf5ff' : '#fafafa',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {isExpanded ? <ChevronDown size={18} style={{ color: '#a855f7' }} /> : <ChevronRight size={18} style={{ color: '#94a3b8' }} />}
                                                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
                                                        {weekNum === 0 ? 'Minggu Awal' : `Week ${weekNum}`}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '12px',
                                                        color: '#64748b',
                                                        background: 'white',
                                                        padding: '3px 10px',
                                                        borderRadius: '9999px',
                                                        border: '1px solid #e2e8f0'
                                                    }}>
                                                        {weekData.tanggal_pemberian && new Date(weekData.tanggal_pemberian).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        background: dosis > 0 ? '#f3e8ff' : '#f1f5f9',
                                                        padding: '4px 12px',
                                                        borderRadius: '6px',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        color: dosis > 0 ? '#7c3aed' : '#64748b'
                                                    }}>
                                                        <Droplets size={14} />
                                                        {dosis} ml
                                                    </div>
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div style={{
                                                    padding: '18px',
                                                    background: 'white',
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                                    gap: '12px'
                                                }}>
                                                    <div style={{
                                                        padding: '14px',
                                                        background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                                                        borderRadius: '10px',
                                                        border: '1px solid #e9d5ff'
                                                    }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#7c3aed', marginBottom: '4px' }}>Jumlah Dosis</div>
                                                        <div style={{
                                                            fontSize: '22px',
                                                            fontWeight: 700,
                                                            color: '#6b21a8',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}>
                                                            <Droplets size={20} />
                                                            {dosis} <span style={{ fontSize: '14px', fontWeight: 500 }}>ml</span>
                                                        </div>
                                                    </div>

                                                    <div style={{
                                                        padding: '14px',
                                                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                                        borderRadius: '10px',
                                                        border: '1px solid #bfdbfe'
                                                    }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#2563eb', marginBottom: '4px' }}>Jenis PKMK</div>
                                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e40af' }}>
                                                            {weekData.jenis_pkmk || 'F100/F75'}
                                                        </div>
                                                    </div>

                                                    <div style={{
                                                        padding: '14px',
                                                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                                        borderRadius: '10px',
                                                        border: '1px solid #e2e8f0'
                                                    }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Tanggal Pemberian</div>
                                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                                                            {weekData.tanggal_pemberian
                                                                ? new Date(weekData.tanggal_pemberian).toLocaleDateString('id-ID', {
                                                                    weekday: 'long',
                                                                    day: 'numeric',
                                                                    month: 'long',
                                                                    year: 'numeric'
                                                                })
                                                                : '-'
                                                            }
                                                        </div>
                                                    </div>

                                                    {weekData.catatan && (
                                                        <div style={{
                                                            gridColumn: 'span 3',
                                                            padding: '14px',
                                                            background: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
                                                            borderRadius: '10px',
                                                            border: '1px solid #fde047'
                                                        }}>
                                                            <div style={{ fontSize: '11px', fontWeight: 600, color: '#a16207', marginBottom: '4px' }}>Catatan</div>
                                                            <div style={{ fontSize: '14px', color: '#78350f' }}>
                                                                {weekData.catatan}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '16px 28px',
                            background: '#f8fafc',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={() => setSelectedBalita(null)}
                                style={{
                                    padding: '10px 20px',
                                    background: '#0f172a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    fontSize: '14px',
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
