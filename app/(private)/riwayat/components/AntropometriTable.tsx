"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Coffee, Pill, Eye, Scale, Ruler } from "lucide-react";

type AntropometriItem = {
    balita_id: string;
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

function getInitials(name: string | null): string {
    if (!name) return "?";
    const parts = name.split(" ").filter(p => p.length > 0);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

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
                    background: rgba(20, 184, 166, 0.03);
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
                    color: #1e40af;
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
                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                    border: 1px solid #bbf7d0;
                    border-radius: 9999px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #15803d;
                }
                .measurement-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .measurement-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px 10px;
                    background: #f8fafc;
                    border-radius: 6px;
                    font-size: 13px;
                    font-weight: 600;
                }
                .measurement-item.bb {
                    color: #1d4ed8;
                }
                .measurement-item.tb {
                    color: #7c3aed;
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
                                <th>BB/TB Terakhir</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'right' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item) => {
                                const latest = getLatestData(item);
                                const initials = getInitials(item.nama_balita);
                                const isMale = item.jk === 'L';

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
                                            <div className="measurement-group">
                                                <div className="measurement-item bb">
                                                    <Scale size={14} />
                                                    <span>{latest.bb ? `${latest.bb}kg` : '-'}</span>
                                                </div>
                                                <div className="measurement-item tb">
                                                    <Ruler size={14} />
                                                    <span>{latest.tb ? `${latest.tb}cm` : '-'}</span>
                                                </div>
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
                                                    title="Lihat Detail Riwayat"
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
                                                    <Coffee size={18} />
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
                            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
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
                                <Ruler size={18} style={{ color: '#059669' }} />
                                Riwayat Pengukuran Mingguan
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[...Array(12)].map((_, idx) => {
                                    const weekNum = idx + 1;
                                    const weekData = selectedBalita.weeks[weekNum];
                                    if (!weekData) return null;
                                    const isExpanded = expandedWeeks.includes(weekNum);

                                    return (
                                        <div key={weekNum} style={{
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '10px',
                                            overflow: 'hidden',
                                            transition: 'border-color 0.2s',
                                            borderColor: isExpanded ? '#10b981' : '#e2e8f0'
                                        }}>
                                            <button
                                                onClick={() => toggleWeek(weekNum)}
                                                style={{
                                                    width: '100%',
                                                    padding: '14px 18px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    background: isExpanded ? '#f0fdf4' : '#fafafa',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {isExpanded ? <ChevronDown size={18} style={{ color: '#059669' }} /> : <ChevronRight size={18} style={{ color: '#94a3b8' }} />}
                                                    <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>Week {weekNum}</span>
                                                    <span style={{
                                                        fontSize: '12px',
                                                        color: '#64748b',
                                                        background: 'white',
                                                        padding: '3px 10px',
                                                        borderRadius: '9999px',
                                                        border: '1px solid #e2e8f0'
                                                    }}>
                                                        {weekData.tanggal_pengukuran && new Date(weekData.tanggal_pengukuran).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        background: '#dbeafe',
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        color: '#1d4ed8'
                                                    }}>
                                                        <Scale size={13} />
                                                        {weekData.bb} kg
                                                    </div>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        background: '#f3e8ff',
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        color: '#7c3aed'
                                                    }}>
                                                        <Ruler size={13} />
                                                        {weekData.tb} cm
                                                    </div>
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div style={{
                                                    padding: '18px',
                                                    background: 'white',
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(5, 1fr)',
                                                    gap: '12px'
                                                }}>
                                                    <div style={{
                                                        padding: '14px',
                                                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                                        borderRadius: '10px',
                                                        border: '1px solid #bfdbfe'
                                                    }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#1d4ed8', marginBottom: '4px' }}>Berat Badan</div>
                                                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#1e40af' }}>{weekData.bb} <span style={{ fontSize: '13px', fontWeight: 500 }}>kg</span></div>
                                                        {weekData.delta_bb !== undefined && (
                                                            <div style={{
                                                                fontSize: '12px',
                                                                marginTop: '6px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                color: weekData.delta_bb >= 0 ? '#059669' : '#dc2626'
                                                            }}>
                                                                {weekData.delta_bb >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                                {weekData.delta_bb >= 0 ? '+' : ''}{weekData.delta_bb.toFixed(2)} kg
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div style={{
                                                        padding: '14px',
                                                        background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                                                        borderRadius: '10px',
                                                        border: '1px solid #e9d5ff'
                                                    }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#7c3aed', marginBottom: '4px' }}>Tinggi Badan</div>
                                                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#6b21a8' }}>{weekData.tb} <span style={{ fontSize: '13px', fontWeight: 500 }}>cm</span></div>
                                                        {weekData.delta_tb !== undefined && (
                                                            <div style={{
                                                                fontSize: '12px',
                                                                marginTop: '6px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                color: weekData.delta_tb >= 0 ? '#059669' : '#dc2626'
                                                            }}>
                                                                {weekData.delta_tb >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                                {weekData.delta_tb >= 0 ? '+' : ''}{weekData.delta_tb.toFixed(2)} cm
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div style={{
                                                        padding: '14px',
                                                        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                                                        borderRadius: '10px',
                                                        border: '1px solid #fde68a'
                                                    }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#d97706', marginBottom: '4px' }}>ZS-BBU</div>
                                                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#92400e' }}>{weekData.zs_bbu?.toFixed(2) || '-'}</div>
                                                    </div>

                                                    <div style={{
                                                        padding: '14px',
                                                        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                                                        borderRadius: '10px',
                                                        border: '1px solid #a7f3d0'
                                                    }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#059669', marginBottom: '4px' }}>ZS-TBU</div>
                                                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#065f46' }}>{weekData.zs_tbu?.toFixed(2) || '-'}</div>
                                                    </div>

                                                    <div style={{
                                                        padding: '14px',
                                                        background: 'linear-gradient(135deg, #fff1f2 0%, #fecdd3 100%)',
                                                        borderRadius: '10px',
                                                        border: '1px solid #fda4af'
                                                    }}>
                                                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#e11d48', marginBottom: '4px' }}>ZS-BBTB</div>
                                                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#be123c' }}>{weekData.zs_bbtb?.toFixed(2) || '-'}</div>
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
