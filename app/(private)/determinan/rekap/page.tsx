"use client";
import { useState, useEffect } from "react";
import { ClipboardList, Download, FileSpreadsheet, FileText, Calendar, MapPin, Building2, ChevronDown, AlertCircle } from "lucide-react";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type Question = {
    key: string;
    label: string;
    riskAnswer: string;
    ya: { count: number; percent: number };
    tidak: { count: number; percent: number };
    total: number;
    riskLevel: 'low' | 'medium' | 'high';
};

type Section = {
    name: string;
    icon: string;
    questions: Question[];
};

type RekapData = {
    userRole: string | null;
    totalSurveys: number;
    totalPuskesmas: number;
    totalDesa: number;
    sections: Section[];
};

type Pkm = { id: string; nama: string };

const MONTHS = [
    { value: '', label: 'Semua Bulan' },
    { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maret' },
    { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' }, { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function RekapDeterminan() {
    const [data, setData] = useState<RekapData | null>(null);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(String(currentYear));
    const [month, setMonth] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Location filters
    const [kecList, setKecList] = useState<string[]>([]);
    const [pkmList, setPkmList] = useState<Pkm[]>([]);
    const [desaList, setDesaList] = useState<string[]>([]);
    const [kec, setKec] = useState("");
    const [puskesmasId, setPuskesmasId] = useState("");
    const [desa, setDesa] = useState("");
    const [userRole, setUserRole] = useState<string | null>(null);

    // Fetch Kecamatan on mount
    useEffect(() => {
        (async () => {
            await ensureServerSession();
            const headers = await getAuthHeaders();
            const res = await fetch('/api/ref/kecamatan', { credentials: 'include', headers });
            const data = await res.json();
            setKecList(data.items || []);
        })();
    }, []);

    // Fetch Puskesmas when kec changes
    useEffect(() => {
        if (!kec) { setPkmList([]); setPuskesmasId(""); return; }
        (async () => {
            await ensureServerSession();
            const headers = await getAuthHeaders();
            const res = await fetch(`/api/ref/puskesmas?kec=${encodeURIComponent(kec)}`, { credentials: 'include', headers });
            const data = await res.json();
            setPkmList((data.items || []).map((r: any) => ({ id: r.id, nama: r.nama })));
        })();
    }, [kec]);

    // Fetch Desa when puskesmasId changes (for admin dinkes)
    useEffect(() => {
        if (userRole === 'admin_puskesmas') return; // Handle separately
        if (!puskesmasId) { setDesaList([]); setDesa(""); return; }
        (async () => {
            const headers = await getAuthHeaders();
            const res = await fetch(`/api/ref/desa?puskesmas_id=${puskesmasId}`, { credentials: 'include', headers });
            const data = await res.json();
            setDesaList((data.items || []).map((d: { desa_kel: string }) => d.desa_kel).sort());
        })();
    }, [puskesmasId, userRole]);

    // Fetch data when filters change
    useEffect(() => {
        fetchData();
    }, [year, month, kec, puskesmasId, desa]);

    // Set userRole and fetch desa for admin_puskesmas
    useEffect(() => {
        if (data?.userRole) {
            setUserRole(data.userRole);
            if (data.userRole === 'admin_puskesmas') {
                (async () => {
                    const headers = await getAuthHeaders();
                    const desaRes = await fetch('/api/ref/desa', { credentials: 'include', headers });
                    const desaData = await desaRes.json();
                    setDesaList((desaData.items || []).map((d: { desa_kel: string }) => d.desa_kel).sort());
                })();
            }
        }
    }, [data?.userRole]);

    const fetchData = async () => {
        setLoading(true);
        try {
            await ensureServerSession();
            const headers = await getAuthHeaders();
            const params = new URLSearchParams();
            if (year) params.set('year', year);
            if (month) params.set('month', month);
            if (userRole !== 'admin_puskesmas') {
                if (kec) params.set('kec', kec);
                if (puskesmasId) params.set('puskesmas_id', puskesmasId);
            }
            if (desa) params.set('desa', desa);

            const res = await fetch(`/api/determinan/rekap?${params.toString()}`, { headers });
            setData(await res.json());
        } catch (err) {
            console.error("Error fetching rekap:", err);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level: string) => {
        if (level === 'high') return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
        if (level === 'medium') return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
        return { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' };
    };

    const exportToExcel = () => {
        if (!data) return;

        const wb = XLSX.utils.book_new();

        // Summary sheet
        const summaryData = [
            ['REKAP TABULASI DETERMINAN STUNTING'],
            [''],
            ['Total Survey', data.totalSurveys],
            ['Total Puskesmas', data.totalPuskesmas],
            ['Total Desa', data.totalDesa],
            [''],
        ];
        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

        // Detail sheet
        const detailData: any[][] = [
            ['Kategori', 'Indikator', 'Ya (n)', 'Ya (%)', 'Tidak (n)', 'Tidak (%)', 'Total', 'Level Risiko']
        ];

        data.sections.forEach(section => {
            section.questions.forEach((q, idx) => {
                detailData.push([
                    idx === 0 ? section.name : '',
                    q.label,
                    q.ya.count,
                    q.ya.percent,
                    q.tidak.count,
                    q.tidak.percent,
                    q.total,
                    q.riskLevel === 'high' ? 'Tinggi' : q.riskLevel === 'medium' ? 'Sedang' : 'Rendah'
                ]);
            });
        });

        const detailWs = XLSX.utils.aoa_to_sheet(detailData);
        XLSX.utils.book_append_sheet(wb, detailWs, 'Detail Indikator');

        XLSX.writeFile(wb, `Rekap_Determinan_${year}${month ? '_' + month : ''}.xlsx`);
        setShowExportMenu(false);
    };

    const exportToPDF = () => {
        if (!data) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 20;

        // Header
        doc.setFillColor(139, 92, 246);
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.text('REKAP TABULASI DETERMINAN STUNTING', pageWidth / 2, 18, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Kabupaten Malang', pageWidth / 2, 28, { align: 'center' });
        const periodLabel = year ? (month ? `${MONTHS.find(m => m.value === month)?.label || ''} ${year}` : `Tahun ${year}`) : 'Semua Periode';
        doc.setFontSize(10);
        doc.text(`Periode: ${periodLabel}`, pageWidth / 2, 36, { align: 'center' });

        yPos = 50;

        // Summary box
        doc.setFillColor(248, 250, 252);
        doc.rect(14, yPos, pageWidth - 28, 20, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(51, 51, 51);
        doc.text(`Total Survey: ${data.totalSurveys}`, 20, yPos + 8);
        doc.text(`Total Puskesmas: ${data.totalPuskesmas}`, 80, yPos + 8);
        doc.text(`Total Desa: ${data.totalDesa}`, 140, yPos + 8);

        yPos = 80;

        // Tables for each section
        data.sections.forEach((section, sIdx) => {
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(51, 51, 51);
            doc.text(`${section.icon} ${section.name}`, 14, yPos);
            yPos += 5;

            autoTable(doc, {
                startY: yPos,
                head: [['Indikator', 'Ya n(%)', 'Tidak n(%)', 'Total', 'Risiko']],
                body: section.questions.map(q => [
                    q.label,
                    `${q.ya.count} (${q.ya.percent}%)`,
                    `${q.tidak.count} (${q.tidak.percent}%)`,
                    q.total,
                    q.riskLevel === 'high' ? '🔴 Tinggi' : q.riskLevel === 'medium' ? '🟡 Sedang' : '🟢 Rendah'
                ]),
                headStyles: { fillColor: [139, 92, 246], fontSize: 9 },
                bodyStyles: { fontSize: 8 },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { left: 14, right: 14 },
            });

            yPos = (doc as any).lastAutoTable.finalY + 15;
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }

        doc.save(`Rekap_Determinan_${year}${month ? '_' + month : ''}.pdf`);
        setShowExportMenu(false);
    };

    return (
        <>
            <style>{`
                .rekap-container { max-width: 1400px; margin: 0 auto; padding: 32px; }
                .filter-select {
                    padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0;
                    background: white; font-size: 14px; color: #374151; min-width: 140px;
                }
                .section-card {
                    background: white; border-radius: 16px; border: 1px solid #e5e7eb;
                    padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
                }
                .section-title {
                    display: flex; align-items: center; gap: 10px;
                    font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 16px;
                }
            `}</style>

            <div className="rekap-container">
                {/* Header */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: 14,
                            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)',
                        }}>
                            <ClipboardList size={28} color="white" />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#111827', margin: 0 }}>
                                Rekap Tabulasi Determinan
                            </h1>
                            <p style={{ color: '#6b7280', marginTop: 4 }}>Tabulasi detail indikator survey stunting</p>
                        </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setShowExportMenu(!showExportMenu)} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                            borderRadius: 10, border: '1px solid #dce5e4', background: 'white',
                            fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer',
                        }}>
                            <Download size={16} /> Export <ChevronDown size={14} />
                        </button>
                        {showExportMenu && (
                            <div style={{
                                position: 'absolute', right: 0, top: '100%', marginTop: 4,
                                background: 'white', borderRadius: 10, border: '1px solid #e2e8f0',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 10, minWidth: 160,
                            }}>
                                <button onClick={exportToExcel} style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '12px 16px', border: 'none', background: 'none',
                                    fontSize: 14, color: '#374151', cursor: 'pointer', textAlign: 'left',
                                }}>
                                    <FileSpreadsheet size={16} color="#22c55e" /> Export Excel
                                </button>
                                <button onClick={exportToPDF} style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '12px 16px', border: 'none', background: 'none',
                                    fontSize: 14, color: '#374151', cursor: 'pointer', textAlign: 'left',
                                    borderTop: '1px solid #f1f5f9',
                                }}>
                                    <FileText size={16} color="#ef4444" /> Export PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24,
                    padding: 16, background: 'white', borderRadius: 12, border: '1px solid #e5e7eb',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={16} color="#64748b" />
                        <select value={year} onChange={(e) => setYear(e.target.value)} className="filter-select">
                            <option value="">Semua Tahun</option>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select value={month} onChange={(e) => setMonth(e.target.value)} className="filter-select">
                            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    {userRole === 'admin_puskesmas' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MapPin size={16} color="#64748b" />
                            <select value={desa} onChange={(e) => setDesa(e.target.value)} className="filter-select">
                                <option value="">Semua Desa</option>
                                {desaList.map((d, i) => <option key={i} value={d}>{d}</option>)}
                            </select>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <MapPin size={16} color="#64748b" />
                                <select value={kec} onChange={(e) => setKec(e.target.value)} className="filter-select">
                                    <option value="">Semua Kecamatan</option>
                                    {kecList.map((k, i) => <option key={i} value={k}>{k}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Building2 size={16} color="#64748b" />
                                <select value={puskesmasId} onChange={(e) => setPuskesmasId(e.target.value)} className="filter-select" disabled={!kec}>
                                    <option value="">Semua Puskesmas</option>
                                    {pkmList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <MapPin size={16} color="#64748b" />
                                <select value={desa} onChange={(e) => setDesa(e.target.value)} className="filter-select" disabled={!puskesmasId}>
                                    <option value="">Semua Desa</option>
                                    {desaList.map((d, i) => <option key={i} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                </div>

                {/* Summary Badge */}
                {data && (
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24,
                        padding: 16, background: 'linear-gradient(135deg, #ede9fe, #f5f3ff)',
                        borderRadius: 12, border: '1px solid #ddd6fe',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, color: '#6b7280' }}>Total Survey:</span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#7c3aed' }}>{data.totalSurveys}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, color: '#6b7280' }}>Puskesmas:</span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#7c3aed' }}>{data.totalPuskesmas}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 13, color: '#6b7280' }}>Desa:</span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: '#7c3aed' }}>{data.totalDesa}</span>
                        </div>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: 60, color: '#6b7280' }}>
                        Memuat data...
                    </div>
                )}

                {/* No Data */}
                {!loading && (!data || data.totalSurveys === 0) && (
                    <div style={{
                        textAlign: 'center', padding: 60, color: '#6b7280',
                        background: 'white', borderRadius: 16, border: '1px solid #e5e7eb',
                    }}>
                        <AlertCircle size={48} color="#d1d5db" style={{ marginBottom: 16 }} />
                        <p>Tidak ada data survey untuk filter yang dipilih</p>
                    </div>
                )}

                {/* Tables */}
                {!loading && data && data.sections.map((section, sIdx) => (
                    <div key={sIdx} className="section-card">
                        <div className="section-title">
                            <span style={{ fontSize: 24 }}>{section.icon}</span>
                            {section.name}
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Indikator</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0', width: 120 }}>Ya</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0', width: 120 }}>Tidak</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0', width: 80 }}>Total</th>
                                        <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', borderBottom: '2px solid #e2e8f0', width: 100 }}>Risiko</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {section.questions.map((q, qIdx) => {
                                        const riskColor = getRiskColor(q.riskLevel);
                                        return (
                                            <tr key={qIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '14px 16px', fontWeight: 500, color: '#0f172a' }}>{q.label}</td>
                                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                    <span style={{ fontWeight: 600 }}>{q.ya.count}</span>
                                                    <span style={{ color: '#6b7280', marginLeft: 4 }}>({q.ya.percent}%)</span>
                                                </td>
                                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                    <span style={{ fontWeight: 600 }}>{q.tidak.count}</span>
                                                    <span style={{ color: '#6b7280', marginLeft: 4 }}>({q.tidak.percent}%)</span>
                                                </td>
                                                <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>{q.total}</td>
                                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                                    <span style={{
                                                        display: 'inline-block', padding: '4px 12px', borderRadius: 20,
                                                        background: riskColor.bg, color: riskColor.text, fontWeight: 600, fontSize: 12,
                                                        border: `1px solid ${riskColor.border}`,
                                                    }}>
                                                        {q.riskLevel === 'high' ? 'Tinggi' : q.riskLevel === 'medium' ? 'Sedang' : 'Rendah'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}

                {/* Legend */}
                {!loading && data && data.totalSurveys > 0 && (
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: 16, padding: 16,
                        background: '#f8fafc', borderRadius: 12, marginTop: 8,
                    }}>
                        <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Keterangan Risiko:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, background: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 600 }}>Tinggi</span>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>≥50% responden berisiko</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, background: '#fffbeb', color: '#d97706', fontSize: 12, fontWeight: 600 }}>Sedang</span>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>25-49% responden berisiko</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 12, background: '#f0fdf4', color: '#16a34a', fontSize: 12, fontWeight: 600 }}>Rendah</span>
                            <span style={{ fontSize: 12, color: '#6b7280' }}>&lt;25% responden berisiko</span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
