"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import * as XLSX from 'xlsx';

type AppUser = { role: 'superadmin' | 'admin_puskesmas'; puskesmas_id: string | null };

type RekapItem = {
    puskesmas: string;
    jumlah_sasaran: number;
    diberi_pkmk_bulan_ini: number;
    belum_selesai: number;
    dropout: number;
    selesai_sampai_bulan_ini: number;
    status_gizi: {
        gizi_buruk: number;
        gizi_kurang: number;
        stunted: number;
        severe_stunted: number;
        underweight: number;
        severe_underweight: number;
    };
};

export default function RekapLaporanPage() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<AppUser | null>(null);

    // Filter state
    const [kecList, setKecList] = useState<string[]>([]);
    const [pkmList, setPkmList] = useState<{ id: string; nama: string }[]>([]);
    const [desaList, setDesaList] = useState<{ id: string; desa_kel: string }[]>([]);

    const [kec, setKec] = useState("");
    const [puskesmasId, setPuskesmasId] = useState("");
    const [desaKel, setDesaKel] = useState("");
    const [tahun, setTahun] = useState<string>(new Date().getFullYear().toString());
    const [bulan, setBulan] = useState<string>((new Date().getMonth() + 1).toString());

    // Data state
    const [rekapData, setRekapData] = useState<RekapItem[]>([]);
    const [dataLoading, setDataLoading] = useState(false);

    // Initialize
    useEffect(() => {
        (async () => {
            try {
                await ensureServerSession();
                const authHeaders = await getAuthHeaders();

                const userRes = await fetch("/api/auth/session", { credentials: 'include', headers: authHeaders });
                const userData = await userRes.json();
                setUser(userData.user);

                if (userData.user.role === 'superadmin') {
                    const kecRes = await fetch("/api/ref/kecamatan", { credentials: 'include', headers: authHeaders });
                    const kecData = await kecRes.json();
                    const filteredKec = (kecData.items || []).filter((k: string) =>
                        !k.toLowerCase().includes('kabupaten')
                    );
                    setKecList(filteredKec);
                } else {
                    setPuskesmasId(userData.user.puskesmas_id);
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        })();
    }, []);

    // Load puskesmas when kecamatan changes
    useEffect(() => {
        if (!kec || user?.role !== 'superadmin') return;
        (async () => {
            await ensureServerSession();
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/ref/puskesmas?kecamatan=${encodeURIComponent(kec)}`, {
                credentials: 'include',
                headers: authHeaders
            });
            const data = await res.json();
            const filteredItems = (data.items || []).filter((p: any) =>
                !p.nama?.toLowerCase().includes('dinkes')
            );
            setPkmList(filteredItems);
            setPuskesmasId("");
            setDesaKel("");
        })();
    }, [kec, user]);

    // Load desa when puskesmas changes
    useEffect(() => {
        const targetPuskesmasId = user?.role === 'admin_puskesmas' ? user.puskesmas_id : puskesmasId;
        if (!targetPuskesmasId) {
            setDesaList([]);
            return;
        }
        (async () => {
            await ensureServerSession();
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/ref/desa?puskesmas_id=${targetPuskesmasId}`, {
                credentials: 'include',
                headers: authHeaders
            });
            const data = await res.json();
            setDesaList(data.items || []);
            setDesaKel("");
        })();
    }, [puskesmasId, user]);

    // Apply filter
    const applyFilter = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!tahun || !bulan) {
            alert("Pilih Tahun dan Bulan terlebih dahulu!");
            return;
        }

        setDataLoading(true);
        await ensureServerSession();
        const authHeaders = await getAuthHeaders();

        const params = new URLSearchParams();
        if (puskesmasId) params.set("puskesmas_id", puskesmasId);
        if (desaKel) params.set("desa_kel", desaKel);
        if (tahun) params.set("tahun", tahun);
        if (bulan) params.set("bulan", bulan);

        try {
            const res = await fetch(`/api/rekap-laporan?${params}`, { credentials: 'include', headers: authHeaders });
            const data = await res.json();
            setRekapData(data.items || []);
        } catch (err) {
            console.error(err);
            alert("Gagal memuat data rekap laporan");
        } finally {
            setDataLoading(false);
        }
    };

    // Download Excel
    const downloadExcel = () => {
        if (rekapData.length === 0) {
            alert("Tidak ada data untuk diunduh");
            return;
        }

        const rows = rekapData.map((item, idx) => ({
            'No': idx + 1,
            'Puskesmas': item.puskesmas,
            'Jumlah Sasaran Balita': item.jumlah_sasaran,
            'Jumlah Balita Diberi PKMK Bulan ini': item.diberi_pkmk_bulan_ini,
            'PKMK Belum Selesai Bulan Ini': item.belum_selesai,
            'Dropout Bulan ini': item.dropout,
            'PKMK Selesai Sampai Bulan ini': item.selesai_sampai_bulan_ini,
            'Gizi Buruk': item.status_gizi.gizi_buruk,
            'Gizi Kurang': item.status_gizi.gizi_kurang,
            'Stunted': item.status_gizi.stunted,
            'Severe Stunted': item.status_gizi.severe_stunted,
            'Underweight': item.status_gizi.underweight,
            'Severe Underweight': item.status_gizi.severe_underweight
        }));

        rows.push({
            'No': '' as any,
            'Puskesmas': 'JUMLAH',
            'Jumlah Sasaran Balita': rekapData.reduce((sum, item) => sum + item.jumlah_sasaran, 0),
            'Jumlah Balita Diberi PKMK Bulan ini': rekapData.reduce((sum, item) => sum + item.diberi_pkmk_bulan_ini, 0),
            'PKMK Belum Selesai Bulan Ini': rekapData.reduce((sum, item) => sum + item.belum_selesai, 0),
            'Dropout Bulan ini': rekapData.reduce((sum, item) => sum + item.dropout, 0),
            'PKMK Selesai Sampai Bulan ini': rekapData.reduce((sum, item) => sum + item.selesai_sampai_bulan_ini, 0),
            'Gizi Buruk': rekapData.reduce((sum, item) => sum + item.status_gizi.gizi_buruk, 0),
            'Gizi Kurang': rekapData.reduce((sum, item) => sum + item.status_gizi.gizi_kurang, 0),
            'Stunted': rekapData.reduce((sum, item) => sum + item.status_gizi.stunted, 0),
            'Severe Stunted': rekapData.reduce((sum, item) => sum + item.status_gizi.severe_stunted, 0),
            'Underweight': rekapData.reduce((sum, item) => sum + item.status_gizi.underweight, 0),
            'Severe Underweight': rekapData.reduce((sum, item) => sum + item.status_gizi.severe_underweight, 0)
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rekap Laporan");

        const fileName = `Rekap_Laporan_${tahun}_${bulan}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    // Calculate totals
    const totals = {
        sasaran: rekapData.reduce((sum, item) => sum + item.jumlah_sasaran, 0),
        diberiPkmk: rekapData.reduce((sum, item) => sum + item.diberi_pkmk_bulan_ini, 0),
        selesai: rekapData.reduce((sum, item) => sum + item.selesai_sampai_bulan_ini, 0),
        dropout: rekapData.reduce((sum, item) => sum + item.dropout, 0),
        belumSelesai: rekapData.reduce((sum, item) => sum + item.belum_selesai, 0),
        giziBuruk: rekapData.reduce((sum, item) => sum + item.status_gizi.gizi_buruk, 0),
        giziKurang: rekapData.reduce((sum, item) => sum + item.status_gizi.gizi_kurang, 0),
        stunted: rekapData.reduce((sum, item) => sum + item.status_gizi.stunted, 0),
        severeStunted: rekapData.reduce((sum, item) => sum + item.status_gizi.severe_stunted, 0),
        underweight: rekapData.reduce((sum, item) => sum + item.status_gizi.underweight, 0),
        severeUnderweight: rekapData.reduce((sum, item) => sum + item.status_gizi.severe_underweight, 0),
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <div style={{ width: 40, height: 40, border: '4px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
            {/* Breadcrumbs */}
            <nav style={{ display: 'flex', gap: 8, fontSize: 14, marginBottom: 24 }}>
                <Link href="/dashboard" style={{ color: '#64748b', fontWeight: 500, textDecoration: 'none' }}>Home</Link>
                <span style={{ color: '#cbd5e1' }}>/</span>
                <Link href="/rekap-laporan" style={{ color: '#64748b', fontWeight: 500, textDecoration: 'none' }}>Laporan</Link>
                <span style={{ color: '#cbd5e1' }}>/</span>
                <span style={{ color: '#1e293b', fontWeight: 600 }}>Rekap Stunting</span>
            </nav>

            {/* Page Heading */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 24, marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>
                        📊 Rekap Laporan Balita Stunting
                    </h1>
                    <p style={{ color: '#64748b', fontSize: 16, marginTop: 8 }}>
                        Rekapitulasi data stunting per periode, desa, dan puskesmas
                    </p>
                </div>
                {rekapData.length > 0 && (
                    <button
                        onClick={downloadExcel}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px',
                            background: 'linear-gradient(to right, #ecfdf5, #f0fdfa)', color: '#065f46',
                            borderRadius: 12, border: '1px solid #a7f3d0', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                    >
                        📥 Download Excel
                    </button>
                )}
            </div>

            {/* Filter Card - Stitch Style */}
            <form onSubmit={applyFilter} style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', padding: 24, marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 24 }}>
                    <span style={{ fontSize: 20 }}>🔍</span>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>Filter Periode Laporan</h2>
                </div>

                {/* Location Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }} className="filter-grid-3">
                    {user?.role === 'superadmin' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Kecamatan</label>
                            <select value={kec} onChange={(e) => setKec(e.target.value)} style={{ width: '100%', height: 48, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 16px', fontSize: 14 }}>
                                <option value="">Semua Kecamatan</option>
                                {kecList.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                    )}
                    {user?.role === 'superadmin' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Puskesmas</label>
                            <select value={puskesmasId} onChange={(e) => { setPuskesmasId(e.target.value); setDesaKel(""); }} style={{ width: '100%', height: 48, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 16px', fontSize: 14 }}>
                                <option value="">Semua Puskesmas</option>
                                {pkmList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                            </select>
                        </div>
                    )}
                    {desaList.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Desa/Kelurahan</label>
                            <select value={desaKel} onChange={(e) => setDesaKel(e.target.value)} style={{ width: '100%', height: 48, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 16px', fontSize: 14 }}>
                                <option value="">Semua Desa</option>
                                {desaList.map(d => <option key={d.id} value={d.desa_kel}>{d.desa_kel}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* Time Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }} className="filter-grid-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Tahun <span style={{ color: '#ef4444' }}>*</span></label>
                        <select value={tahun} onChange={(e) => setTahun(e.target.value)} required style={{ width: '100%', height: 48, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', padding: '0 16px', fontSize: 14, fontWeight: 500 }}>
                            <option value="">-- Pilih Tahun --</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Bulan <span style={{ color: '#ef4444' }}>*</span></label>
                        <select value={bulan} onChange={(e) => setBulan(e.target.value)} required style={{ width: '100%', height: 48, borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', padding: '0 16px', fontSize: 14, fontWeight: 500 }}>
                            <option value="">-- Pilih Bulan --</option>
                            {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                                <option key={i + 1} value={String(i + 1)}>{m}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button type="submit" disabled={dataLoading} style={{ width: '100%', height: 48, background: 'linear-gradient(to right, #10b981, #14b8a6)', color: 'white', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(16,185,129,0.25)', opacity: dataLoading ? 0.7 : 1 }}>
                    🔎 {dataLoading ? 'Memuat...' : 'Terapkan Filter'}
                </button>
            </form>

            {/* Summary Statistics Cards */}
            {rekapData.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }} className="stat-grid">
                    <div style={{ background: 'white', padding: 16, borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 999, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👥</div>
                        <div>
                            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Total Sasaran</p>
                            <p style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: 0 }}>{totals.sasaran.toLocaleString()}</p>
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: 16, borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 999, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🍽️</div>
                        <div>
                            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Diberi PKMK</p>
                            <p style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: 0 }}>{totals.diberiPkmk.toLocaleString()}</p>
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: 16, borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 999, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✅</div>
                        <div>
                            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Selesai</p>
                            <p style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: 0 }}>{totals.selesai.toLocaleString()}</p>
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: 16, borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 999, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>❌</div>
                        <div>
                            <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>Dropout</p>
                            <p style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', margin: 0 }}>{totals.dropout.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Data Table */}
            {rekapData.length > 0 ? (
                <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: 1200, borderCollapse: 'collapse' }}>
                            <thead>
                                {/* Row 1: Groups */}
                                <tr>
                                    <th rowSpan={2} style={{ background: '#1e293b', color: 'white', padding: 16, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', borderRight: '1px solid #334155', width: 60 }}>No</th>
                                    <th rowSpan={2} style={{ background: '#1e293b', color: 'white', padding: 16, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', borderRight: '1px solid #334155', textAlign: 'left', minWidth: 180 }}>Puskesmas</th>
                                    <th colSpan={3} style={{ background: '#2563eb', color: 'white', padding: 12, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', borderRight: '1px solid #3b82f6', textAlign: 'center' }}>Balita Stunting</th>
                                    <th colSpan={2} style={{ background: '#9333ea', color: 'white', padding: 12, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', borderRight: '1px solid #a855f7', textAlign: 'center' }}>Status Bulan Ini</th>
                                    <th colSpan={6} style={{ background: '#d97706', color: 'white', padding: 12, fontWeight: 700, fontSize: 12, textTransform: 'uppercase', textAlign: 'center' }}>Status Gizi Akhir</th>
                                </tr>
                                {/* Row 2: Columns */}
                                <tr style={{ background: '#f8fafc', fontSize: 11, fontWeight: 600 }}>
                                    <th style={{ padding: 12, borderRight: '1px solid #e2e8f0', background: '#eff6ff', color: '#1e3a8a' }}>Jml Sasaran</th>
                                    <th style={{ padding: 12, borderRight: '1px solid #e2e8f0', background: '#eff6ff', color: '#1e3a8a' }}>Diberi PKMK</th>
                                    <th style={{ padding: 12, borderRight: '1px solid #e2e8f0', background: '#eff6ff', color: '#1e3a8a' }}>Belum Selesai</th>
                                    <th style={{ padding: 12, borderRight: '1px solid #e2e8f0', background: '#faf5ff', color: '#581c87' }}>Dropout</th>
                                    <th style={{ padding: 12, borderRight: '1px solid #e2e8f0', background: '#faf5ff', color: '#581c87' }}>Selesai</th>
                                    <th style={{ padding: 12, borderRight: '1px solid #e2e8f0', background: '#fffbeb', color: '#78350f' }}>Gizi Buruk</th>
                                    <th style={{ padding: 12, borderRight: '1px solid #e2e8f0', background: '#fffbeb', color: '#78350f' }}>Gizi Kurang</th>
                                    <th style={{ padding: 12, borderRight: '1px solid #e2e8f0', background: '#fffbeb', color: '#78350f' }}>Stunted</th>
                                    <th style={{ padding: 12, borderRight: '1px solid #e2e8f0', background: '#fffbeb', color: '#78350f' }}>Sev.Stunted</th>
                                    <th style={{ padding: 12, borderRight: '1px solid #e2e8f0', background: '#fffbeb', color: '#78350f' }}>Underweight</th>
                                    <th style={{ padding: 12, background: '#fffbeb', color: '#78350f' }}>Sev.Under</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rekapData.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }} onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.background = idx % 2 === 1 ? '#fafafa' : 'white'}>
                                        <td style={{ padding: 12, textAlign: 'center', borderRight: '1px solid #f1f5f9', background: idx % 2 === 1 ? '#fafafa' : 'white' }}>{idx + 1}</td>
                                        <td style={{ padding: 12, fontWeight: 600, color: '#1e293b', borderRight: '1px solid #f1f5f9', background: idx % 2 === 1 ? '#fafafa' : 'white' }}>{item.puskesmas}</td>
                                        <td style={{ padding: 12, textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>{item.jumlah_sasaran}</td>
                                        <td style={{ padding: 12, textAlign: 'center', borderRight: '1px solid #f1f5f9', color: '#059669', fontWeight: 600, background: 'rgba(16,185,129,0.05)' }}>{item.diberi_pkmk_bulan_ini}</td>
                                        <td style={{ padding: 12, textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>{item.belum_selesai}</td>
                                        <td style={{ padding: 12, textAlign: 'center', borderRight: '1px solid #f1f5f9', color: '#dc2626' }}>{item.dropout}</td>
                                        <td style={{ padding: 12, textAlign: 'center', borderRight: '1px solid #f1f5f9', color: '#0d9488', fontWeight: 600 }}>{item.selesai_sampai_bulan_ini}</td>
                                        <td style={{ padding: 12, textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>{item.status_gizi.gizi_buruk}</td>
                                        <td style={{ padding: 12, textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>{item.status_gizi.gizi_kurang}</td>
                                        <td style={{ padding: 12, textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>{item.status_gizi.stunted}</td>
                                        <td style={{ padding: 12, textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>{item.status_gizi.severe_stunted}</td>
                                        <td style={{ padding: 12, textAlign: 'center', borderRight: '1px solid #f1f5f9' }}>{item.status_gizi.underweight}</td>
                                        <td style={{ padding: 12, textAlign: 'center' }}>{item.status_gizi.severe_underweight}</td>
                                    </tr>
                                ))}
                            </tbody>
                            {/* Footer: JUMLAH */}
                            <tfoot>
                                <tr style={{ background: 'linear-gradient(to right, #10b981, #14b8a6)', color: 'white', fontWeight: 700, fontSize: 13 }}>
                                    <td colSpan={2} style={{ padding: 14, textAlign: 'center' }}>JUMLAH</td>
                                    <td style={{ padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.1)' }}>{totals.sasaran}</td>
                                    <td style={{ padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.2)' }}>{totals.diberiPkmk}</td>
                                    <td style={{ padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.1)' }}>{totals.belumSelesai}</td>
                                    <td style={{ padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.1)' }}>{totals.dropout}</td>
                                    <td style={{ padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.2)' }}>{totals.selesai}</td>
                                    <td style={{ padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.1)' }}>{totals.giziBuruk}</td>
                                    <td style={{ padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.1)' }}>{totals.giziKurang}</td>
                                    <td style={{ padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.1)' }}>{totals.stunted}</td>
                                    <td style={{ padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.1)' }}>{totals.severeStunted}</td>
                                    <td style={{ padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.1)' }}>{totals.underweight}</td>
                                    <td style={{ padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.1)' }}>{totals.severeUnderweight}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            ) : (
                !dataLoading && (
                    <div style={{ background: 'white', padding: 64, borderRadius: 16, border: '2px dashed #e2e8f0', textAlign: 'center' }}>
                        <div style={{ width: 64, height: 64, borderRadius: 999, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32 }}>📊</div>
                        <p style={{ color: '#64748b', fontWeight: 500 }}>Silakan pilih periode dan terapkan filter untuk melihat rekap laporan</p>
                    </div>
                )
            )}

            <style jsx>{`
                @media (max-width: 1024px) {
                    .filter-grid-3 { grid-template-columns: 1fr !important; }
                    .filter-grid-2 { grid-template-columns: 1fr !important; }
                    .stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
                @media (max-width: 640px) {
                    .stat-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}
