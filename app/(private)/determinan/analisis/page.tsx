"use client";
import { useState, useEffect } from "react";
import { BarChart3, AlertTriangle, AlertCircle, CheckCircle, ClipboardList, TrendingUp, MapPin, Download, Calendar, FileSpreadsheet, ChevronDown, Info, Building2, FileText } from "lucide-react";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type AnalysisData = {
    summary: {
        totalSurveys: number;
        riskDistribution: { tinggi: number; sedang: number; rendah: number };
        avgRiskScore: number;
    };
    factorPrevalence: Array<{
        key: string;
        label: string;
        section: string;
        riskCount: number;
        answeredCount: number;
        prevalence: number;
    }>;
    geographic: Array<{
        kecamatan: string;
        total: number;
        tinggi: number;
        sedang: number;
        rendah: number;
        percentTinggi: number;
    }>;
    trends: Array<{
        month: string;
        count: number;
        avgScore: string;
        tinggi: number;
        sedang: number;
        rendah: number;
    }>;
    userRole?: string | null;
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

export default function AnalisisDeterminan() {
    const [data, setData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState('');
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

    // Fetch data when filters change
    useEffect(() => {
        fetchData();
    }, [year, month, kec, puskesmasId, desa]);

    // Set userRole and fetch desa list when data is loaded
    useEffect(() => {
        if (data?.userRole) {
            setUserRole(data.userRole);

            // For admin_puskesmas, fetch desa list from API
            if (data.userRole === 'admin_puskesmas') {
                (async () => {
                    try {
                        const headers = await getAuthHeaders();
                        // Fetch all desa for this puskesmas (no puskesmas_id needed, will be filtered by API based on user's puskesmas)
                        const desaRes = await fetch('/api/ref/desa', { credentials: 'include', headers });
                        const desaData = await desaRes.json();
                        const desaNames = (desaData.items || []).map((d: { desa_kel: string }) => d.desa_kel).sort();
                        setDesaList(desaNames);
                    } catch (err) {
                        console.error('Error fetching desa:', err);
                    }
                })();
            }
        }
    }, [data?.userRole]);

    // Fetch desa list when puskesmasId changes (for admin dinkes)
    useEffect(() => {
        if (userRole === 'admin_puskesmas') return; // Already handled separately
        if (!puskesmasId) { setDesaList([]); setDesa(""); return; }
        (async () => {
            try {
                const headers = await getAuthHeaders();
                const desaRes = await fetch(`/api/ref/desa?puskesmas_id=${puskesmasId}`, { credentials: 'include', headers });
                const desaData = await desaRes.json();
                const desaNames = (desaData.items || []).map((d: { desa_kel: string }) => d.desa_kel).sort();
                setDesaList(desaNames);
            } catch (err) {
                console.error('Error fetching desa:', err);
            }
        })();
    }, [puskesmasId, userRole]);

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
                if (desa) params.set('desa', desa);
            } else {
                if (desa) params.set('desa', desa);
            }

            const res = await fetch(`/api/determinan/analysis?${params.toString()}`, { headers });
            setData(await res.json());
        } catch (err) {
            console.error("Error fetching analysis:", err);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!data) return;
        let csv = "Analisis Determinan Stunting\n\n";
        csv += "SUMMARY\n";
        csv += `Total Survey,${data.summary.totalSurveys}\n`;
        csv += `Risiko Tinggi,${data.summary.riskDistribution.tinggi}\n`;
        csv += `Risiko Sedang,${data.summary.riskDistribution.sedang}\n`;
        csv += `Risiko Rendah,${data.summary.riskDistribution.rendah}\n\n`;
        csv += "PREVALENSI FAKTOR RISIKO\n";
        csv += "Rank,Faktor,Section,Prevalensi (%)\n";
        data.factorPrevalence.forEach((f, i) => {
            csv += `${i + 1},"${f.label}","${f.section}",${f.prevalence}\n`;
        });
        csv += "\nANALISIS GEOGRAFIS\n";
        csv += "Kecamatan,Total,Tinggi,Sedang,Rendah,% Tinggi\n";
        data.geographic.forEach(g => {
            csv += `"${g.kecamatan}",${g.total},${g.tinggi},${g.sedang},${g.rendah},${g.percentTinggi}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analisis_determinan_${year}${month ? '_' + month : ''}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setShowExportMenu(false);
    };

    const exportToPDF = () => {
        if (!data) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 20;

        // Header with gradient-like effect
        doc.setFillColor(139, 92, 246);
        doc.rect(0, 0, pageWidth, 45, 'F');
        doc.setFillColor(124, 58, 237);
        doc.rect(0, 0, pageWidth / 2, 45, 'F');

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text('LAPORAN ANALISIS DETERMINAN STUNTING', pageWidth / 2, 22, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Sistem Monitoring Stunting - Kabupaten Malang', pageWidth / 2, 32, { align: 'center' });

        // Report info
        const reportDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const periodLabel = year ? (month ? `${MONTHS.find(m => m.value === month)?.label || ''} ${year}` : `Tahun ${year}`) : 'Semua Periode';
        doc.setFontSize(10);
        doc.text(`Tanggal Cetak: ${reportDate} | Periode: ${periodLabel}`, pageWidth / 2, 40, { align: 'center' });

        yPos = 55;

        // Summary Section
        doc.setFillColor(248, 250, 252);
        doc.rect(14, yPos, pageWidth - 28, 40, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(14, yPos, pageWidth - 28, 40, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('RINGKASAN ANALISIS', 20, yPos + 10);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);

        // Summary stats in columns
        const colWidth = (pageWidth - 40) / 4;
        const statsY = yPos + 25;

        doc.setTextColor(100, 116, 139);
        doc.text('Total Survey', 20, statsY);
        doc.text('Risiko Tinggi', 20 + colWidth, statsY);
        doc.text('Risiko Sedang', 20 + colWidth * 2, statsY);
        doc.text('Risiko Rendah', 20 + colWidth * 3, statsY);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(139, 92, 246);
        doc.text(String(data.summary.totalSurveys), 20, statsY + 10);
        doc.setTextColor(220, 38, 38);
        doc.text(String(data.summary.riskDistribution.tinggi), 20 + colWidth, statsY + 10);
        doc.setTextColor(217, 119, 6);
        doc.text(String(data.summary.riskDistribution.sedang), 20 + colWidth * 2, statsY + 10);
        doc.setTextColor(22, 163, 74);
        doc.text(String(data.summary.riskDistribution.rendah), 20 + colWidth * 3, statsY + 10);

        yPos = yPos + 50;

        // Risk Distribution percentages
        if (data.summary.totalSurveys > 0) {
            yPos += 5;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(15, 23, 42);
            doc.text('Distribusi Risiko:', 20, yPos);

            const pctTinggi = ((data.summary.riskDistribution.tinggi / data.summary.totalSurveys) * 100).toFixed(1);
            const pctSedang = ((data.summary.riskDistribution.sedang / data.summary.totalSurveys) * 100).toFixed(1);
            const pctRendah = ((data.summary.riskDistribution.rendah / data.summary.totalSurveys) * 100).toFixed(1);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text(`Tinggi: ${pctTinggi}% | Sedang: ${pctSedang}% | Rendah: ${pctRendah}%`, 70, yPos);
            yPos += 15;
        } else {
            yPos += 10;
        }

        // Top 10 Risk Factors Table
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('TOP 10 FAKTOR RISIKO PREVALENSI TERTINGGI', 14, yPos);
        yPos += 5;

        const top10Factors = (data.factorPrevalence || []).slice(0, 10);
        autoTable(doc, {
            startY: yPos,
            head: [['No', 'Faktor Risiko', 'Kategori', 'Jumlah Kasus', 'Prevalensi (%)']],
            body: top10Factors.map((f, i) => [
                i + 1,
                f.label,
                f.section,
                `${f.riskCount} / ${f.answeredCount}`,
                `${f.prevalence}%`
            ]),
            headStyles: {
                fillColor: [139, 92, 246],
                textColor: 255,
                fontSize: 9,
                fontStyle: 'bold',
            },
            bodyStyles: {
                fontSize: 8,
                textColor: [51, 51, 51],
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252],
            },
            columnStyles: {
                0: { cellWidth: 12, halign: 'center' },
                1: { cellWidth: 60 },
                2: { cellWidth: 45 },
                3: { cellWidth: 25, halign: 'center' },
                4: { cellWidth: 25, halign: 'center' },
            },
            margin: { left: 14, right: 14 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Check if need new page
        if (yPos > 230) {
            doc.addPage();
            yPos = 20;
        }

        // Geographic Analysis Table
        const geoData = (data.geographic || []).filter(g => g.kecamatan && g.kecamatan.trim() !== '');
        if (geoData.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(15, 23, 42);
            doc.text('ANALISIS GEOGRAFIS PER KECAMATAN', 14, yPos);
            yPos += 5;

            autoTable(doc, {
                startY: yPos,
                head: [['Kecamatan', 'Total Survey', 'Tinggi', 'Sedang', 'Rendah', '% Tinggi']],
                body: geoData.map(g => [
                    g.kecamatan,
                    g.total,
                    g.tinggi,
                    g.sedang,
                    g.rendah,
                    `${g.percentTinggi}%`
                ]),
                headStyles: {
                    fillColor: [16, 185, 129],
                    textColor: 255,
                    fontSize: 9,
                    fontStyle: 'bold',
                },
                bodyStyles: {
                    fontSize: 9,
                    textColor: [51, 51, 51],
                },
                alternateRowStyles: {
                    fillColor: [240, 253, 244],
                },
                columnStyles: {
                    0: { cellWidth: 50 },
                    1: { cellWidth: 25, halign: 'center' },
                    2: { cellWidth: 20, halign: 'center' },
                    3: { cellWidth: 20, halign: 'center' },
                    4: { cellWidth: 20, halign: 'center' },
                    5: { cellWidth: 25, halign: 'center' },
                },
                margin: { left: 14, right: 14 },
            });

            yPos = (doc as any).lastAutoTable.finalY + 15;
        }

        // Notes section
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFillColor(254, 249, 195);
        doc.rect(14, yPos, pageWidth - 28, 35, 'F');
        doc.setDrawColor(253, 224, 71);
        doc.rect(14, yPos, pageWidth - 28, 35, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(161, 98, 7);
        doc.text('CATATAN METODOLOGI:', 20, yPos + 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('- Risiko Tinggi: >= 17 faktor risiko positif', 20, yPos + 17);
        doc.text('- Risiko Sedang: 9-16 faktor risiko positif', 20, yPos + 24);
        doc.text('- Risiko Rendah: < 9 faktor risiko positif', 20, yPos + 31);

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(
                `Halaman ${i} dari ${pageCount} | Dicetak dari Sistem Monitoring PKMK - Dinas Kesehatan Kabupaten Malang`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        doc.save(`Laporan_Determinan_Stunting_${year || 'All'}${month ? '_' + month : ''}.pdf`);
        setShowExportMenu(false);
    };

    const getPrevalenceColor = (p: number) => {
        if (p >= 50) return { bg: '#fef2f2', bar: '#ef4444', text: '#dc2626' };
        if (p >= 25) return { bg: '#fffbeb', bar: '#f59e0b', text: '#d97706' };
        return { bg: '#f0fdf4', bar: '#22c55e', text: '#16a34a' };
    };

    const getRiskIndicator = (p: number) => {
        if (p >= 30) return { color: '#dc2626', icon: '🔴' };
        if (p >= 15) return { color: '#f59e0b', icon: '🟡' };
        return { color: '#22c55e', icon: '🟢' };
    };

    const totalSurveys = data?.summary?.totalSurveys || 0;
    const { tinggi = 0, sedang = 0, rendah = 0 } = data?.summary?.riskDistribution || {};


    return (
        <>
            <style>{`
                .analysis-container { max-width: 1400px; margin: 0 auto; padding: 32px; }
                .stat-card {
                    background: white; padding: 24px; border-radius: 16px;
                    border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                    transition: all 0.3s ease; position: relative; overflow: hidden;
                }
                .stat-card::before {
                    content: ''; position: absolute; top: 0; left: 0;
                    width: 4px; height: 100%; border-radius: 16px 0 0 16px;
                }
                .stat-card.purple::before { background: linear-gradient(180deg, #8b5cf6, #7c3aed); }
                .stat-card.red::before { background: linear-gradient(180deg, #ef4444, #dc2626); }
                .stat-card.yellow::before { background: linear-gradient(180deg, #f59e0b, #d97706); }
                .stat-card.green::before { background: linear-gradient(180deg, #22c55e, #16a34a); }
                .stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -8px rgba(0,0,0,0.12); }
                .stat-icon {
                    width: 52px; height: 52px; border-radius: 14px;
                    display: flex; align-items: center; justify-content: center;
                }
                .stat-icon.purple { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35); }
                .stat-icon.red { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35); }
                .stat-icon.yellow { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35); }
                .stat-icon.green { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.35); }
                .stat-label { font-size: 13px; font-weight: 600; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.03em; }
                .stat-value { font-size: 34px; font-weight: 900; color: #0f172a; line-height: 1.1; }
                .stat-hint { font-size: 12px; color: #94a3b8; margin-top: 8px; }
                .section-card {
                    background: white; border-radius: 16px; padding: 24px;
                    border: 1px solid #e5e7eb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                }
                .section-title {
                    font-size: 16px; font-weight: 700; color: #0f172a;
                    display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
                }
                .filter-select {
                    padding: 10px 14px; border-radius: 10px; border: 1px solid #e2e8f0;
                    font-size: 14px; background: white; min-width: 120px;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className="analysis-container">
                {/* Header */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div className="stat-icon purple">
                            <BarChart3 size={26} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 30, fontWeight: 900, color: '#111817', letterSpacing: '-0.025em', margin: 0 }}>
                                Analisis Determinan Stunting
                            </h1>
                            <p style={{ color: '#638884', marginTop: 4 }}>Dashboard analitik faktor risiko stunting</p>
                        </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setShowExportMenu(!showExportMenu)} style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                            borderRadius: 10, border: '1px solid #dce5e4', background: 'white',
                            fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                        }}>
                            <Download size={16} /> Export <ChevronDown size={14} />
                        </button>
                        {showExportMenu && (
                            <div style={{
                                position: 'absolute', right: 0, top: '100%', marginTop: 4,
                                background: 'white', borderRadius: 10, border: '1px solid #e2e8f0',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 10, minWidth: 160,
                            }}>
                                <button onClick={exportToCSV} style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '12px 16px', border: 'none', background: 'none',
                                    fontSize: 14, color: '#374151', cursor: 'pointer', textAlign: 'left',
                                }}>
                                    <FileSpreadsheet size={16} color="#22c55e" /> Export CSV
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

                {/* Filters Row */}
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
                        /* Desa filter for Admin Puskesmas */
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MapPin size={16} color="#64748b" />
                            <select value={desa} onChange={(e) => setDesa(e.target.value)} className="filter-select">
                                <option value="">Semua Desa</option>
                                {desaList.map((d, i) => <option key={i} value={d}>{d}</option>)}
                            </select>
                        </div>
                    ) : (
                        /* Kecamatan and Puskesmas filter for Superadmin/Dinkes */
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

                {/* Notes Section - Risk Category Explanation */}
                <div style={{
                    background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderRadius: 16,
                    padding: 20, marginBottom: 24, border: '1px solid #e2e8f0',
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <Info size={18} color="white" />
                        </div>
                        <div>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                                Pendekatan Analisis Kategori Risiko Stunting
                            </h4>
                            <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                                Kategorisasi risiko stunting berdasarkan <strong>26 faktor determinan</strong> yang terbagi dalam 5 domain:
                                Riwayat Kelahiran & Ibu, ASI & MP-ASI (IYCF), Penyakit Infeksi, WASH & Sosial Ekonomi, dan Pola Pengasuhan.
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 3, background: '#22c55e' }} />
                                    <span style={{ fontSize: 12, color: '#475569' }}><strong>Rendah:</strong> 0-8 faktor risiko</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 3, background: '#f59e0b' }} />
                                    <span style={{ fontSize: 12, color: '#475569' }}><strong>Sedang:</strong> 9-16 faktor risiko</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 3, background: '#ef4444' }} />
                                    <span style={{ fontSize: 12, color: '#475569' }}><strong>Tinggi:</strong> &gt;16 faktor risiko</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                        <div style={{ width: 48, height: 48, border: '4px solid #e2e8f0', borderTopColor: '#8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 24 }}>
                            <div className="stat-card purple">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div className="stat-icon purple"><ClipboardList size={24} /></div>
                                </div>
                                <div className="stat-label">Total Survey</div>
                                <div className="stat-value">{totalSurveys}</div>
                                <div className="stat-hint">Data survey terkumpul</div>
                            </div>
                            <div className="stat-card red">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div className="stat-icon red"><AlertTriangle size={24} /></div>
                                    <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 20, background: '#fef2f2', color: '#dc2626' }}>
                                        {totalSurveys > 0 ? ((tinggi / totalSurveys) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <div className="stat-label">Risiko Tinggi</div>
                                <div className="stat-value">{tinggi}</div>
                                <div className="stat-hint">&gt;16 faktor risiko</div>
                            </div>
                            <div className="stat-card yellow">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div className="stat-icon yellow"><AlertCircle size={24} /></div>
                                    <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 20, background: '#fffbeb', color: '#d97706' }}>
                                        {totalSurveys > 0 ? ((sedang / totalSurveys) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <div className="stat-label">Risiko Sedang</div>
                                <div className="stat-value">{sedang}</div>
                                <div className="stat-hint">9-16 faktor risiko</div>
                            </div>
                            <div className="stat-card green">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div className="stat-icon green"><CheckCircle size={24} /></div>
                                    <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a' }}>
                                        {totalSurveys > 0 ? ((rendah / totalSurveys) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <div className="stat-label">Risiko Rendah</div>
                                <div className="stat-value">{rendah}</div>
                                <div className="stat-hint">0-8 faktor risiko</div>
                            </div>
                        </div>

                        {/* Two Column Layout */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
                            {/* Risk Distribution */}
                            <div className="section-card">
                                <div className="section-title">
                                    <BarChart3 size={18} color="#8b5cf6" /> Distribusi Kategori Risiko
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, padding: '20px 0' }}>
                                    <div style={{ position: 'relative', width: 160, height: 160 }}>
                                        <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                                            {totalSurveys > 0 && (
                                                <>
                                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeDasharray={`${(tinggi / totalSurveys) * 100} 100`} />
                                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeDasharray={`${(sedang / totalSurveys) * 100} 100`} strokeDashoffset={`-${(tinggi / totalSurveys) * 100}`} />
                                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3.5" strokeDasharray={`${(rendah / totalSurveys) * 100} 100`} strokeDashoffset={`-${((tinggi + sedang) / totalSurveys) * 100}`} />
                                                </>
                                            )}
                                        </svg>
                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                            <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>{totalSurveys}</div>
                                            <div style={{ fontSize: 12, color: '#64748b' }}>Total</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        {[{ label: 'Tinggi', value: tinggi, color: '#ef4444' }, { label: 'Sedang', value: sedang, color: '#f59e0b' }, { label: 'Rendah', value: rendah, color: '#22c55e' }].map(item => (
                                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 14, height: 14, borderRadius: 4, background: item.color }} />
                                                <span style={{ fontSize: 14, color: '#475569', minWidth: 60 }}>{item.label}</span>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Geographic Analysis */}
                            <div className="section-card">
                                <div className="section-title">
                                    <MapPin size={18} color="#8b5cf6" /> Analisis per {userRole === 'admin_puskesmas' ? 'Desa' : 'Kecamatan'}
                                </div>
                                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc' }}>
                                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569', position: 'sticky', top: 0, background: '#f8fafc' }}>{userRole === 'admin_puskesmas' ? 'Desa' : 'Kecamatan'}</th>
                                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#475569', position: 'sticky', top: 0, background: '#f8fafc' }}>Total</th>
                                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#475569', position: 'sticky', top: 0, background: '#f8fafc' }}>% Tinggi</th>
                                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#475569', position: 'sticky', top: 0, background: '#f8fafc' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(data?.geographic || []).filter(g => g.kecamatan && g.kecamatan !== 'Unknown').slice(0, 15).map((g, idx) => {
                                                const indicator = getRiskIndicator(parseFloat(String(g.percentTinggi)));
                                                return (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ padding: '12px', fontWeight: 500 }}>{g.kecamatan}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{g.total}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: indicator.color }}>{g.percentTinggi}%</td>
                                                        <td style={{ padding: '12px', textAlign: 'center', fontSize: 16 }}>{indicator.icon}</td>
                                                    </tr>
                                                );
                                            })}
                                            {(!data?.geographic || data.geographic.filter(g => g.kecamatan && g.kecamatan !== 'Unknown').length === 0) && (
                                                <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Tidak ada data</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Factor Prevalence */}
                        <div className="section-card" style={{ marginBottom: 24 }}>
                            <div className="section-title">
                                <TrendingUp size={18} color="#8b5cf6" /> Prevalensi Faktor Risiko (Top 15)
                            </div>
                            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                                Ranking faktor risiko berdasarkan prevalensi. Semakin tinggi %, semakin banyak balita terpapar faktor tersebut.
                            </p>
                            <div style={{ display: 'grid', gap: 10 }}>
                                {(data?.factorPrevalence || []).slice(0, 15).map((f, idx) => {
                                    const colors = getPrevalenceColor(f.prevalence);
                                    return (
                                        <div key={f.key} style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '14px 16px', background: colors.bg, borderRadius: 12,
                                            border: `1px solid ${colors.bar}20`,
                                        }}>
                                            <div style={{
                                                width: 30, height: 30, borderRadius: 8, background: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 13, fontWeight: 700, color: colors.text,
                                                border: `2px solid ${colors.bar}`,
                                            }}>{idx + 1}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{f.label}</div>
                                                <div style={{ fontSize: 11, color: '#64748b' }}>{f.section}</div>
                                            </div>
                                            <div style={{ width: 180 }}>
                                                <div style={{ height: 10, background: 'white', borderRadius: 5, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ width: `${f.prevalence}%`, height: '100%', background: colors.bar, borderRadius: 5, transition: 'width 0.5s' }} />
                                                </div>
                                            </div>
                                            <div style={{ minWidth: 55, textAlign: 'right', fontSize: 15, fontWeight: 700, color: colors.text }}>{f.prevalence}%</div>
                                        </div>
                                    );
                                })}
                                {(!data?.factorPrevalence || data.factorPrevalence.length === 0) && (
                                    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Tidak ada data survey</div>
                                )}
                            </div>
                        </div>

                        {/* Monthly Trends */}
                        {data?.trends && data.trends.length > 0 && (
                            <div className="section-card">
                                <div className="section-title">
                                    <Calendar size={18} color="#8b5cf6" /> Trend Bulanan
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc' }}>
                                                <th style={{ padding: '14px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Bulan</th>
                                                <th style={{ padding: '14px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Jumlah</th>
                                                <th style={{ padding: '14px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Avg Score</th>
                                                <th style={{ padding: '14px', textAlign: 'center', fontWeight: 600, color: '#dc2626' }}>Tinggi</th>
                                                <th style={{ padding: '14px', textAlign: 'center', fontWeight: 600, color: '#d97706' }}>Sedang</th>
                                                <th style={{ padding: '14px', textAlign: 'center', fontWeight: 600, color: '#16a34a' }}>Rendah</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.trends.map((t, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '14px', fontWeight: 500 }}>{t.month}</td>
                                                    <td style={{ padding: '14px', textAlign: 'center', fontWeight: 600 }}>{t.count}</td>
                                                    <td style={{ padding: '14px', textAlign: 'center' }}>{t.avgScore}</td>
                                                    <td style={{ padding: '14px', textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>{t.tinggi}</td>
                                                    <td style={{ padding: '14px', textAlign: 'center', color: '#d97706', fontWeight: 600 }}>{t.sedang}</td>
                                                    <td style={{ padding: '14px', textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>{t.rendah}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
