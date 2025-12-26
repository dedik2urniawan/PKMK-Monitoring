"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import { BarChart3, Download, Filter, CheckCircle, AlertTriangle, XCircle, ArrowDownCircle, ArrowUpCircle, History, FileSpreadsheet, Image as ImageIcon, X, Box, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type AppUser = { role: 'superadmin' | 'admin_puskesmas'; puskesmas_id: string | null };

type RekapItem = {
    puskesmas_id: string;
    puskesmas_nama: string;
    jenis_pkmk_id: string;
    merk: string;
    kategori_usia: string;
    stok_saat_ini: number;
    stok_minimum: number;
    masuk_periode: number;
    keluar_periode: number;
    status: 'aman' | 'menipis' | 'habis';
};

type TransaksiItem = {
    id: string;
    tanggal: string;
    tipe_transaksi: string;
    puskesmas_nama: string;
    merk: string;
    kategori_usia: string;
    jumlah: number;
    keterangan: string | null;
    no_batch: string | null;
    foto_url: string | null;
    created_at: string;
};

type Summary = {
    total_stok: number;
    total_masuk: number;
    total_keluar: number;
    count_habis: number;
    count_menipis: number;
    count_aman: number;
};

type Puskesmas = { id: string; nama: string };

export default function RekapLogistikPage() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<AppUser | null>(null);
    const [activeTab, setActiveTab] = useState<'rekap' | 'history'>('rekap');

    const [rekapData, setRekapData] = useState<RekapItem[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [puskesmasList, setPuskesmasList] = useState<Puskesmas[]>([]);

    const [historyData, setHistoryData] = useState<TransaksiItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const [tahun, setTahun] = useState(new Date().getFullYear().toString());
    const [bulan, setBulan] = useState((new Date().getMonth() + 1).toString());
    const [filterPuskesmas, setFilterPuskesmas] = useState("");

    const [historyPuskesmas, setHistoryPuskesmas] = useState("");
    const [historyTipe, setHistoryTipe] = useState("");
    const [historyLimit, setHistoryLimit] = useState("100");

    const [viewFotoUrl, setViewFotoUrl] = useState<string | null>(null);
    const [showFotoModal, setShowFotoModal] = useState(false);

    const bulanOptions = [
        { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' }, { value: '3', label: 'Maret' },
        { value: '4', label: 'April' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
        { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' }, { value: '9', label: 'September' },
        { value: '10', label: 'Oktober' }, { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
    ];

    useEffect(() => {
        (async () => {
            try {
                await ensureServerSession();
                const authHeaders = await getAuthHeaders();
                const userRes = await fetch("/api/auth/session", { credentials: 'include', headers: authHeaders });
                const userData = await userRes.json();
                setUser(userData.user);
                if (userData.user.role === 'superadmin') {
                    const pkmRes = await fetch("/api/ref/puskesmas", { credentials: 'include', headers: authHeaders });
                    const pkmData = await pkmRes.json();
                    setPuskesmasList(pkmData.items || []);
                }
                setLoading(false);
            } catch (err) { console.error(err); setLoading(false); }
        })();
    }, []);

    const loadRekap = async () => {
        setLoading(true);
        const authHeaders = await getAuthHeaders();
        const params = new URLSearchParams();
        params.set('tahun', tahun);
        params.set('bulan', bulan);
        if (filterPuskesmas) params.set('puskesmas_id', filterPuskesmas);
        const res = await fetch(`/api/logistik/rekap?${params}`, { credentials: 'include', headers: authHeaders });
        const data = await res.json();
        setRekapData(data.items || []);
        setSummary(data.summary || null);
        setLoading(false);
    };

    const loadHistory = async () => {
        setHistoryLoading(true);
        const authHeaders = await getAuthHeaders();
        const params = new URLSearchParams();
        params.set('limit', historyLimit);
        if (historyPuskesmas) params.set('puskesmas_id', historyPuskesmas);
        if (historyTipe) params.set('tipe_transaksi', historyTipe);
        const res = await fetch(`/api/logistik/transaksi?${params}`, { credentials: 'include', headers: authHeaders });
        const data = await res.json();
        setHistoryData(data.items || []);
        setHistoryLoading(false);
    };

    const handleExportExcel = () => {
        if (rekapData.length === 0) { toast.error("Tidak ada data untuk diekspor"); return; }
        const exportData = rekapData.map((item, idx) => ({
            'No': idx + 1, 'Puskesmas': item.puskesmas_nama, 'Merk PKMK': item.merk,
            'Kategori Usia': item.kategori_usia === 'bayi' ? '0-11 bulan' : '12-59 bulan',
            'Stok Saat Ini': item.stok_saat_ini, 'Stok Minimum': item.stok_minimum,
            'Masuk Periode': item.masuk_periode, 'Keluar Periode': item.keluar_periode,
            'Status': item.status.toUpperCase()
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rekap Logistik");
        const bulanNama = bulanOptions.find(b => b.value === bulan)?.label || bulan;
        XLSX.writeFile(wb, `Rekap_Logistik_${bulanNama}_${tahun}.xlsx`);
        toast.success("Excel berhasil diunduh");
    };

    const handleExportHistory = () => {
        if (historyData.length === 0) { toast.error("Tidak ada data untuk diekspor"); return; }
        const exportData = historyData.map((item, idx) => ({
            'No': idx + 1, 'Tanggal': item.tanggal, 'Tipe': getTipeLabel(item.tipe_transaksi),
            'Puskesmas': item.puskesmas_nama, 'Merk PKMK': item.merk,
            'Jumlah': item.jumlah, 'Keterangan': item.keterangan || '-', 'No. Batch': item.no_batch || '-'
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Riwayat Transaksi");
        XLSX.writeFile(wb, `Riwayat_Transaksi_${new Date().toISOString().slice(0, 10)}.xlsx`);
        toast.success("Excel berhasil diunduh");
    };

    const getTipeLabel = (tipe: string) => {
        const labels: Record<string, string> = {
            'masuk_dinas': 'Masuk dari Dinas', 'masuk_beli': 'Masuk Pembelian', 'masuk_transfer': 'Masuk Transfer',
            'keluar_pemberian': 'Keluar Pemberian', 'keluar_expired': 'Keluar Kadaluarsa',
            'keluar_rusak': 'Keluar Rusak', 'keluar_lainnya': 'Keluar Lainnya'
        };
        return labels[tipe] || tipe;
    };

    const isMasuk = (tipe: string) => tipe.startsWith('masuk');

    if (loading && !rekapData.length) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #9333ea', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <>
            {/* FOTO VIEWER MODAL */}
            {showFotoModal && viewFotoUrl && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)' }}>
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <img src={viewFotoUrl} alt="Foto Dokumentasi" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 16, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }} />
                        <button onClick={() => setShowFotoModal(false)} style={{ position: 'absolute', top: -12, right: -12, width: 40, height: 40, borderRadius: '50%', backgroundColor: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                            <X size={20} color="#374151" />
                        </button>
                    </div>
                </div>
            )}

            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
                {/* Breadcrumbs */}
                <nav style={{ display: 'flex', gap: 8, fontSize: 14, marginBottom: 16 }}>
                    <Link href="/dashboard" style={{ color: '#766388', fontWeight: 500, textDecoration: 'none' }}>Home</Link>
                    <span style={{ color: '#766388' }}>›</span>
                    <Link href="/logistik" style={{ color: '#766388', fontWeight: 500, textDecoration: 'none' }}>Logistik</Link>
                    <span style={{ color: '#766388' }}>›</span>
                    <span style={{ color: '#9333ea', fontWeight: 600 }}>Rekap</span>
                </nav>

                {/* Page Header */}
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#151118', margin: 0, letterSpacing: '-0.02em' }}>📈 Rekap Logistik PKMK</h1>
                    <p style={{ color: '#766388', fontSize: 16, marginTop: 8 }}>Rekapitulasi stok dan transaksi logistik PKMK</p>
                </div>

                {/* Tab Navigation */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'inline-flex', padding: 6, background: 'white', borderRadius: 999, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
                        <button onClick={() => setActiveTab('rekap')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: activeTab === 'rekap' ? 'linear-gradient(to right, #9333ea, #6366f1)' : 'transparent', color: activeTab === 'rekap' ? 'white' : '#766388', boxShadow: activeTab === 'rekap' ? '0 4px 12px rgba(147,51,234,0.3)' : 'none', transition: 'all 0.2s' }}>
                            <BarChart3 size={18} /> Rekap Stok
                        </button>
                        <button onClick={() => { setActiveTab('history'); if (historyData.length === 0) loadHistory(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 999, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: activeTab === 'history' ? 'linear-gradient(to right, #9333ea, #6366f1)' : 'transparent', color: activeTab === 'history' ? 'white' : '#766388', boxShadow: activeTab === 'history' ? '0 4px 12px rgba(147,51,234,0.3)' : 'none', transition: 'all 0.2s' }}>
                            <History size={18} /> Riwayat Transaksi
                        </button>
                    </div>
                </div>

                {/* TAB: REKAP STOK */}
                {activeTab === 'rekap' && (
                    <>
                        {/* Filter Card */}
                        <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 24, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                <Filter size={20} color="#9333ea" />
                                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#151118' }}>Filter Periode</h3>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
                                <div style={{ minWidth: 150 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#766388', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tahun</label>
                                    <select style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e1dce5', background: '#f7f6f8', fontSize: 14, fontWeight: 500 }} value={tahun} onChange={(e) => setTahun(e.target.value)}>
                                        <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                                    </select>
                                </div>
                                <div style={{ minWidth: 150 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#766388', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bulan</label>
                                    <select style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e1dce5', background: '#f7f6f8', fontSize: 14, fontWeight: 500 }} value={bulan} onChange={(e) => setBulan(e.target.value)}>
                                        {bulanOptions.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                                    </select>
                                </div>
                                {user?.role === 'superadmin' && (
                                    <div style={{ flex: 1, minWidth: 200 }}>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#766388', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Puskesmas</label>
                                        <select style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e1dce5', background: '#f7f6f8', fontSize: 14, fontWeight: 500 }} value={filterPuskesmas} onChange={(e) => setFilterPuskesmas(e.target.value)}>
                                            <option value="">Semua Puskesmas</option>
                                            {puskesmasList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                                        </select>
                                    </div>
                                )}
                                <button onClick={loadRekap} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: '#9333ea', color: 'white', borderRadius: 12, fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(147,51,234,0.2)' }}>
                                    <Search size={18} /> Terapkan
                                </button>
                                <button onClick={handleExportExcel} disabled={rekapData.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'white', color: '#10b981', borderRadius: 12, fontWeight: 600, fontSize: 14, border: '2px solid #10b981', cursor: 'pointer', opacity: rekapData.length === 0 ? 0.5 : 1 }}>
                                    <Download size={18} /> Excel
                                </button>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        {summary && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 24 }} className="summary-grid">
                                <div style={{ background: 'white', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{ width: 32, height: 32, borderRadius: 8, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Box size={16} color="#3b82f6" /></span>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Stok</span>
                                    </div>
                                    <p style={{ fontSize: 28, fontWeight: 800, color: '#151118', margin: 0 }}>{summary.total_stok.toLocaleString()}</p>
                                </div>
                                <div style={{ background: 'white', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{ width: 32, height: 32, borderRadius: 8, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowDownCircle size={16} color="#10b981" /></span>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Masuk</span>
                                    </div>
                                    <p style={{ fontSize: 28, fontWeight: 800, color: '#10b981', margin: 0 }}>+{summary.total_masuk.toLocaleString()}</p>
                                </div>
                                <div style={{ background: 'white', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{ width: 32, height: 32, borderRadius: 8, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowUpCircle size={16} color="#ef4444" /></span>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Keluar</span>
                                    </div>
                                    <p style={{ fontSize: 28, fontWeight: 800, color: '#ef4444', margin: 0 }}>-{summary.total_keluar.toLocaleString()}</p>
                                </div>
                                <div style={{ background: 'white', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{ width: 32, height: 32, borderRadius: 8, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={16} color="#10b981" /></span>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aman</span>
                                    </div>
                                    <p style={{ fontSize: 28, fontWeight: 800, color: '#151118', margin: 0 }}>{summary.count_aman}</p>
                                </div>
                                <div style={{ background: 'white', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={16} color="#f59e0b" /></span>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Menipis</span>
                                    </div>
                                    <p style={{ fontSize: 28, fontWeight: 800, color: '#151118', margin: 0 }}>{summary.count_menipis}</p>
                                </div>
                                <div style={{ background: 'white', borderRadius: 16, padding: 16, border: '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <span style={{ width: 32, height: 32, borderRadius: 8, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={16} color="#ef4444" /></span>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Habis</span>
                                    </div>
                                    <p style={{ fontSize: 28, fontWeight: 800, color: '#151118', margin: 0 }}>{summary.count_habis}</p>
                                </div>
                            </div>
                        )}

                        {/* Rekap Table */}
                        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 1000 }}>
                                    <thead>
                                        <tr style={{ background: 'linear-gradient(to right, #9333ea, #6366f1)', color: 'white' }}>
                                            <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'left', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.05em' }}>No</th>
                                            <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'left', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.05em' }}>Puskesmas</th>
                                            <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'left', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.05em' }}>Merk PKMK</th>
                                            <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.05em' }}>Kategori</th>
                                            <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.05em', background: 'rgba(255,255,255,0.1)' }}>Stok</th>
                                            <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.05em', opacity: 0.8 }}>Min</th>
                                            <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.05em', background: 'rgba(16,185,129,0.2)' }}>Masuk</th>
                                            <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.05em', background: 'rgba(239,68,68,0.2)' }}>Keluar</th>
                                            <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', fontSize: 12, letterSpacing: '0.05em' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rekapData.length === 0 ? (
                                            <tr><td colSpan={9} style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Pilih periode dan terapkan filter untuk melihat rekap.</td></tr>
                                        ) : (
                                            rekapData.map((item, idx) => (
                                                <tr key={`${item.puskesmas_id}-${item.jenis_pkmk_id}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '16px 24px', color: '#64748b' }}>{idx + 1}</td>
                                                    <td style={{ padding: '16px 24px', fontWeight: 600, color: '#151118' }}>{item.puskesmas_nama}</td>
                                                    <td style={{ padding: '16px 24px', fontWeight: 600, color: '#151118' }}>{item.merk}</td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                        <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: item.kategori_usia === 'bayi' ? '#fce7f3' : '#e0f2fe', color: item.kategori_usia === 'bayi' ? '#be185d' : '#0369a1' }}>{item.kategori_usia === 'bayi' ? '0-11 bln' : '12-59 bln'}</span>
                                                    </td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, fontSize: 18, background: '#f8fafc', color: item.stok_saat_ini === 0 ? '#ef4444' : '#151118' }}>{item.stok_saat_ini.toLocaleString()}</td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center', color: '#64748b' }}>{item.stok_minimum}</td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.05)' }}>+{item.masuk_periode}</td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.05)' }}>-{item.keluar_periode}</td>
                                                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: item.status === 'aman' ? '#d1fae5' : item.status === 'menipis' ? '#fef3c7' : '#fee2e2', color: item.status === 'aman' ? '#047857' : item.status === 'menipis' ? '#92400e' : '#991b1b', border: `1px solid ${item.status === 'aman' ? '#a7f3d0' : item.status === 'menipis' ? '#fde68a' : '#fecaca'}` }}>
                                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.status === 'aman' ? '#10b981' : item.status === 'menipis' ? '#f59e0b' : '#ef4444' }} />
                                                            {item.status === 'aman' ? 'Aman' : item.status === 'menipis' ? 'Menipis' : 'Habis'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ padding: 16, borderTop: '1px solid #e5e7eb', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 14, color: '#64748b' }}>Menampilkan <strong style={{ color: '#151118' }}>{rekapData.length}</strong> data</span>
                            </div>
                        </div>
                    </>
                )}

                {/* TAB: RIWAYAT TRANSAKSI */}
                {activeTab === 'history' && (
                    <>
                        {/* Filter Card */}
                        <div style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 24, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
                                {user?.role === 'superadmin' && (
                                    <div style={{ flex: 1, minWidth: 200 }}>
                                        <label style={{ fontSize: 12, fontWeight: 600, color: '#766388', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Puskesmas</label>
                                        <select style={{ width: '100%', padding: '12px 16px', borderRadius: 999, border: 'none', background: '#f7f6f8', fontSize: 14, fontWeight: 500 }} value={historyPuskesmas} onChange={(e) => setHistoryPuskesmas(e.target.value)}>
                                            <option value="">Semua Puskesmas</option>
                                            {puskesmasList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: 180 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#766388', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipe Transaksi</label>
                                    <select style={{ width: '100%', padding: '12px 16px', borderRadius: 999, border: 'none', background: '#f7f6f8', fontSize: 14, fontWeight: 500 }} value={historyTipe} onChange={(e) => setHistoryTipe(e.target.value)}>
                                        <option value="">Semua Tipe</option>
                                        <option value="masuk_dinas">Masuk dari Dinas</option>
                                        <option value="masuk_beli">Masuk Pembelian</option>
                                        <option value="masuk_transfer">Masuk Transfer</option>
                                        <option value="keluar_pemberian">Keluar Pemberian</option>
                                        <option value="keluar_expired">Keluar Kadaluarsa</option>
                                        <option value="keluar_rusak">Keluar Rusak</option>
                                        <option value="keluar_lainnya">Keluar Lainnya</option>
                                    </select>
                                </div>
                                <div style={{ minWidth: 130 }}>
                                    <label style={{ fontSize: 12, fontWeight: 600, color: '#766388', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tampilkan</label>
                                    <select style={{ width: '100%', padding: '12px 16px', borderRadius: 999, border: 'none', background: '#f7f6f8', fontSize: 14, fontWeight: 500 }} value={historyLimit} onChange={(e) => setHistoryLimit(e.target.value)}>
                                        <option value="50">50 Baris</option>
                                        <option value="100">100 Baris</option>
                                        <option value="200">200 Baris</option>
                                        <option value="500">500 Baris</option>
                                    </select>
                                </div>
                                <button onClick={loadHistory} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: '#9333ea', color: 'white', borderRadius: 999, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(147,51,234,0.2)' }}>
                                    <Filter size={18} /> Terapkan
                                </button>
                                <button onClick={handleExportHistory} disabled={historyData.length === 0} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'white', color: '#10b981', borderRadius: 999, fontWeight: 700, fontSize: 14, border: '2px solid rgba(16,185,129,0.2)', cursor: 'pointer', opacity: historyData.length === 0 ? 0.5 : 1 }}>
                                    <Download size={18} /> Download Excel
                                </button>
                            </div>
                        </div>

                        {/* History Table */}
                        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            {historyLoading ? (
                                <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Memuat riwayat transaksi...</div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 1000 }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                                                <th style={{ padding: 16, fontWeight: 700, textAlign: 'left', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', color: '#766388' }}>Tanggal</th>
                                                <th style={{ padding: 16, fontWeight: 700, textAlign: 'left', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', color: '#766388' }}>Tipe</th>
                                                <th style={{ padding: 16, fontWeight: 700, textAlign: 'left', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', color: '#766388' }}>Puskesmas</th>
                                                <th style={{ padding: 16, fontWeight: 700, textAlign: 'left', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', color: '#766388' }}>Merk PKMK</th>
                                                <th style={{ padding: 16, fontWeight: 700, textAlign: 'right', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', color: '#766388' }}>Jumlah</th>
                                                <th style={{ padding: 16, fontWeight: 700, textAlign: 'left', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', color: '#766388' }}>Keterangan</th>
                                                <th style={{ padding: 16, fontWeight: 700, textAlign: 'left', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', color: '#766388' }}>No. Batch</th>
                                                <th style={{ padding: 16, fontWeight: 700, textAlign: 'center', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', color: '#766388' }}>Foto</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {historyData.length === 0 ? (
                                                <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Belum ada riwayat transaksi.</td></tr>
                                            ) : (
                                                historyData.map((item, idx) => (
                                                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? '#fafafa' : 'white' }}>
                                                        <td style={{ padding: 16 }}>
                                                            <div style={{ fontWeight: 700, color: '#151118' }}>{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                        </td>
                                                        <td style={{ padding: 16 }}>
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: isMasuk(item.tipe_transaksi) ? '#d1fae5' : '#fee2e2', color: isMasuk(item.tipe_transaksi) ? '#047857' : '#991b1b', border: `1px solid ${isMasuk(item.tipe_transaksi) ? '#a7f3d0' : '#fecaca'}` }}>
                                                                {isMasuk(item.tipe_transaksi) ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                                                                {isMasuk(item.tipe_transaksi) ? 'Masuk' : 'Keluar'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: 16, fontWeight: 500, color: '#151118' }}>{item.puskesmas_nama}</td>
                                                        <td style={{ padding: 16, fontWeight: 500, color: '#151118' }}>{item.merk}</td>
                                                        <td style={{ padding: 16, textAlign: 'right', fontWeight: 700, color: isMasuk(item.tipe_transaksi) ? '#10b981' : '#ef4444' }}>{item.jumlah > 0 ? '+' : ''}{item.jumlah}</td>
                                                        <td style={{ padding: 16, color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.keterangan || '-'}</td>
                                                        <td style={{ padding: 16 }}>
                                                            {item.no_batch ? <span style={{ fontFamily: 'monospace', fontSize: 12, background: '#f1f5f9', padding: '4px 8px', borderRadius: 4, color: '#64748b' }}>{item.no_batch}</span> : <span style={{ color: '#d1d5db' }}>-</span>}
                                                        </td>
                                                        <td style={{ padding: 16, textAlign: 'center' }}>
                                                            {item.foto_url ? (
                                                                <button onClick={() => { setViewFotoUrl(item.foto_url); setShowFotoModal(true); }} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', margin: '0 auto' }}>
                                                                    <ImageIcon size={16} />
                                                                </button>
                                                            ) : <span style={{ color: '#d1d5db' }}>-</span>}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div style={{ padding: 16, borderTop: '1px solid #e5e7eb', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 14, color: '#64748b' }}>Menampilkan <strong style={{ color: '#151118' }}>{historyData.length}</strong> data</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <style jsx>{`
                @media (max-width: 1200px) {
                    .summary-grid { grid-template-columns: repeat(3, 1fr) !important; }
                }
                @media (max-width: 768px) {
                    .summary-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 480px) {
                    .summary-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </>
    );
}
