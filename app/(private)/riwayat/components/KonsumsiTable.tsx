"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, Coffee, Pill, Heart, AlertCircle, ChevronDown, ChevronRight, X, Ruler, CheckCircle2, UtensilsCrossed } from "lucide-react";

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

function getInitials(name: string | null): string {
    if (!name) return "?";
    const parts = name.split(" ").filter(p => p.length > 0);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

export function KonsumsiTable({ data }: { data: KonsumsiItem[] }) {
    const [selectedBalita, setSelectedBalita] = useState<KonsumsiItem | null>(null);
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

    const getLatestData = (item: KonsumsiItem) => {
        const week = item.current_week || 1;
        return item.weeks[week] || {};
    };

    const getComplianceColor = (percent: number) => {
        if (percent >= 80) return { bg: '#dcfce7', text: '#166534' };
        if (percent >= 50) return { bg: '#fef3c7', text: '#92400e' };
        return { bg: '#fee2e2', text: '#991b1b' };
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
                    background: rgba(245, 158, 11, 0.03);
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
                    color: #d97706;
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
                    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
                    border: 1px solid #fcd34d;
                    border-radius: 9999px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #92400e;
                }
                .compliance-bar {
                    width: 100%;
                    max-width: 120px;
                }
                .compliance-bar-bg {
                    height: 8px;
                    background: #e2e8f0;
                    border-radius: 9999px;
                    overflow: hidden;
                }
                .compliance-bar-fill {
                    height: 100%;
                    border-radius: 9999px;
                    transition: width 0.3s;
                }
                .health-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 5px 12px;
                    border-radius: 9999px;
                    font-size: 12px;
                    font-weight: 600;
                }
                .health-badge.sehat {
                    background: #f0fdf4;
                    color: #166534;
                }
                .health-badge.sakit {
                    background: #fef2f2;
                    color: #991b1b;
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
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 34px;
                    height: 34px;
                    border-radius: 9px;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    text-decoration: none;
                    box-sizing: border-box;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                }
                .action-btn:hover {
                    transform: translateY(-1.5px);
                    box-shadow: 0 3px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06);
                }
                .action-btn.view {
                    background: #f8fafc;
                    color: #475569;
                    border: 1px solid #cbd5e1;
                }
                .action-btn.view:hover {
                    background: #f1f5f9;
                    border-color: #94a3b8;
                    color: #1e293b;
                }
                .action-btn.blue {
                    background: #eff6ff;
                    color: #2563eb;
                    border: 1px solid #bfdbfe;
                }
                .action-btn.blue:hover {
                    background: #dbeafe;
                    border-color: #93c5fd;
                    color: #1d4ed8;
                }
                .action-btn.amber {
                    background: #fef3c7;
                    color: #d97706;
                    border: 1px solid #fde68a;
                }
                .action-btn.amber:hover {
                    background: #fde68a;
                    border-color: #fcd34d;
                    color: #b45309;
                }
                .action-btn.purple {
                    background: #faf5ff;
                    color: #9333ea;
                    border: 1px solid #e9d5ff;
                }
                .action-btn.purple:hover {
                    background: #f3e8ff;
                    border-color: #d8b4fe;
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
                                <th>Kepatuhan</th>
                                <th style={{ textAlign: 'center' }}>Kesehatan</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => {
                                const latest = getLatestData(item);
                                const initials = getInitials(item.nama_balita);
                                const isMale = item.jk === 'L';
                                const compliance = latest.kepatuhan_persen || 0;
                                const complianceColor = getComplianceColor(compliance);
                                const isHealthy = latest.status_kesehatan === 'sehat';

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
                                            <div className="compliance-bar">
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    marginBottom: '4px'
                                                }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: complianceColor.text }}>
                                                        {compliance}%
                                                    </span>
                                                </div>
                                                <div className="compliance-bar-bg">
                                                    <div
                                                        className="compliance-bar-fill"
                                                        style={{
                                                            width: `${compliance}%`,
                                                            background: compliance >= 80
                                                                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                                                : compliance >= 50
                                                                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                                                    : 'linear-gradient(90deg, #ef4444, #dc2626)'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span className={`health-badge ${isHealthy ? 'sehat' : 'sakit'}`}>
                                                {isHealthy ? <Heart size={12} style={{ fill: 'currentColor' }} /> : <AlertCircle size={12} />}
                                                {latest.status_kesehatan || '-'}
                                            </span>
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
                                                    title="Lihat Detail Konsumsi"
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
                                                    <Pill size={18} />
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
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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

                            {/* Status Badge in Header */}
                            <div style={{
                                marginTop: '16px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 14px',
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
                                {selectedBalita.status_intervensi}
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '24px 28px', maxHeight: 'calc(85vh - 180px)', overflowY: 'auto' }}>
                            <h3 style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#0f172a',
                                marginBottom: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Coffee size={18} style={{ color: '#d97706' }} />
                                Riwayat Konsumsi Mingguan
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[...Array(13)].map((_, idx) => {
                                    const weekNum = idx;
                                    const weekData = selectedBalita.weeks[weekNum];
                                    if (!weekData) return null;
                                    const isExpanded = expandedWeeks.includes(weekNum);
                                    const compliance = weekData.kepatuhan_persen || 0;
                                    const isHealthy = weekData.status_kesehatan === 'sehat';

                                    return (
                                        <div key={weekNum} style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '10px',
                                            overflow: 'hidden',
                                            transition: 'border-color 0.2s',
                                            borderColor: isExpanded ? '#f59e0b' : '#e2e8f0'
                                        }}>
                                            <button
                                                onClick={() => toggleWeek(weekNum)}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 18px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    background: isExpanded ? '#fffbeb' : '#fafafa',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {isExpanded ? <ChevronDown size={18} style={{ color: '#f59e0b' }} /> : <ChevronRight size={18} style={{ color: '#94a3b8' }} />}
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
                                                        {weekData.tanggal_konsumsi && new Date(weekData.tanggal_konsumsi).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        background: compliance >= 80 ? '#dcfce7' : compliance >= 50 ? '#fef3c7' : '#fee2e2',
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        color: compliance >= 80 ? '#166534' : compliance >= 50 ? '#92400e' : '#991b1b'
                                                    }}>
                                                        {compliance}%
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        background: isHealthy ? '#dcfce7' : '#fee2e2',
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        fontWeight: 600,
                                                        color: isHealthy ? '#166534' : '#991b1b'
                                                    }}>
                                                        {isHealthy ? <Heart size={12} style={{ fill: 'currentColor' }} /> : <AlertCircle size={12} />}
                                                        {weekData.status_kesehatan || '-'}
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
                                                        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                                                        borderRadius: '10px',
                                                        border: '1px solid #fde68a'
                                                    }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#d97706', marginBottom: '4px' }}>Kepatuhan</div>
                                                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#92400e' }}>{compliance}%</div>
                                                        <div style={{
                                                            marginTop: '8px',
                                                            height: '6px',
                                                            background: '#fde68a',
                                                            borderRadius: '9999px',
                                                            overflow: 'hidden'
                                                        }}>
                                                            <div style={{
                                                                height: '100%',
                                                                width: `${compliance}%`,
                                                                background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                                                                borderRadius: '9999px'
                                                            }} />
                                                        </div>
                                                    </div>

                                                    <div style={{
                                                        padding: '14px',
                                                        background: isHealthy
                                                            ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
                                                            : 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
                                                        borderRadius: '10px',
                                                        border: isHealthy ? '1px solid #bbf7d0' : '1px solid #fca5a5'
                                                    }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 600, color: isHealthy ? '#059669' : '#dc2626', marginBottom: '4px' }}>Status Kesehatan</div>
                                                        <div style={{
                                                            fontSize: '18px',
                                                            fontWeight: 700,
                                                            color: isHealthy ? '#166534' : '#991b1b',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px'
                                                        }}>
                                                            {isHealthy ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                                            {weekData.status_kesehatan || '-'}
                                                        </div>
                                                    </div>

                                                    <div style={{
                                                        padding: '14px',
                                                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                                                        borderRadius: '10px',
                                                        border: '1px solid #e2e8f0'
                                                    }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Tanggal Konsumsi</div>
                                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                                                            {weekData.tanggal_konsumsi
                                                                ? new Date(weekData.tanggal_konsumsi).toLocaleDateString('id-ID', {
                                                                    weekday: 'long',
                                                                    day: 'numeric',
                                                                    month: 'long',
                                                                    year: 'numeric'
                                                                })
                                                                : '-'
                                                            }
                                                        </div>
                                                    </div>
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
