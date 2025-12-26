"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import { AntropometriTable } from "./components/AntropometriTable";
import { KonsumsiTable } from "./components/KonsumsiTable";
import { PemberianTable } from "./components/PemberianTable";
import * as XLSX from 'xlsx';

type AppUser = { role: 'superadmin' | 'admin_puskesmas'; puskesmas_id: string | null };

export default function RiwayatIntervensiPage() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<AppUser | null>(null);

    // Filter state
    const [kecList, setKecList] = useState<string[]>([]);
    const [pkmList, setPkmList] = useState<{ id: string; nama: string }[]>([]);
    const [desaList, setDesaList] = useState<{ id: string; desa_kel: string }[]>([]);

    const [kec, setKec] = useState("");
    const [puskesmasId, setPuskesmasId] = useState("");
    const [desa, setDesa] = useState("");
    const [nik, setNik] = useState("");
    const [tahun, setTahun] = useState<string>(new Date().getFullYear().toString());
    const [bulan, setBulan] = useState<string>("");

    // Report type selection (multi-select)
    const [selectedReports, setSelectedReports] = useState<string[]>(["antropometri"]);

    // Data state
    const [antropometriData, setAntropometriData] = useState<any[]>([]);
    const [konsumsiData, setKonsumsiData] = useState<any[]>([]);
    const [pemberianData, setPemberianData] = useState<any[]>([]);
    const [dataLoading, setDataLoading] = useState(false);

    // Initialize filters and user
    useEffect(() => {
        (async () => {
            try {
                await ensureServerSession();
                const authHeaders = await getAuthHeaders();

                // Get current user
                const userRes = await fetch("/api/auth/session", { credentials: 'include', headers: authHeaders });
                const userData = await userRes.json();
                setUser(userData.user);

                // Get kecamatan list (superadmin only)
                if (userData.user.role === 'superadmin') {
                    const kecRes = await fetch("/api/ref/kecamatan", { credentials: 'include', headers: authHeaders });
                    const kecData = await kecRes.json();
                    const filteredKec = (kecData.items || []).filter((k: string) =>
                        !k.toLowerCase().includes('kabupaten')
                    );
                    setKecList(filteredKec);
                } else {
                    // For admin_puskesmas, auto-set puskesmas filter
                    setPuskesmasId(userData.user.puskesmas_id);
                    const pkmRes = await fetch(`/api/ref/puskesmas?id=${userData.user.puskesmas_id}`, {
                        credentials: 'include',
                        headers: authHeaders
                    });
                    const pkmData = await pkmRes.json();
                    if (pkmData.items?.[0]) {
                        setKec(pkmData.items[0].kecamatan);
                    }
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
            setPkmList(data.items || []);
            setDesaList([]);
            setDesa("");
            setPuskesmasId("");
        })();
    }, [kec, user]);

    // Load desa when puskesmas changes
    useEffect(() => {
        if (!puskesmasId) return;
        (async () => {
            await ensureServerSession();
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/ref/desa?puskesmas_id=${encodeURIComponent(puskesmasId)}`, {
                credentials: 'include',
                headers: authHeaders
            });
            const data = await res.json();
            setDesaList(data.items || []);
        })();
    }, [puskesmasId]);

    // Toggle report type selection
    const toggleReport = (type: string, checked: boolean) => {
        if (checked) {
            setSelectedReports(prev => [...prev, type]);
        } else {
            setSelectedReports(prev => prev.filter(t => t !== type));
        }
    };

    // Apply filter and fetch data
    const applyFilter = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setDataLoading(true);
        await ensureServerSession();
        const authHeaders = await getAuthHeaders();

        const params = new URLSearchParams();
        if (puskesmasId) params.set("puskesmas_id", puskesmasId);
        if (desa) params.set("desa_kel", desa);
        if (nik) params.set("nik", nik);
        if (tahun) params.set("tahun", tahun);
        if (bulan) params.set("bulan", bulan);

        try {
            if (selectedReports.includes("antropometri")) {
                const res = await fetch(`/api/riwayat/antropometri?${params}`, { credentials: 'include', headers: authHeaders });
                const data = await res.json();
                setAntropometriData(data.items || []);
            }
            if (selectedReports.includes("konsumsi")) {
                const res = await fetch(`/api/riwayat/konsumsi?${params}`, { credentials: 'include', headers: authHeaders });
                const data = await res.json();
                setKonsumsiData(data.items || []);
            }
            if (selectedReports.includes("pemberian")) {
                const res = await fetch(`/api/riwayat/pemberian?${params}`, { credentials: 'include', headers: authHeaders });
                const data = await res.json();
                setPemberianData(data.items || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setDataLoading(false);
        }
    };

    // Download Excel
    const downloadExcel = () => {
        const wb = XLSX.utils.book_new();

        if (selectedReports.includes('antropometri') && antropometriData.length > 0) {
            const antropometriRows = antropometriData.map((item, idx) => {
                const row: any = {
                    No: idx + 1,
                    'Nama Balita': item.nama_balita,
                    NIK: item.nik,
                    JK: item.jk,
                    'Tgl Lahir': item.tgl_lahir,
                    Kec: item.kec,
                    Puskesmas: item.puskesmas,
                    'Desa/Kel': item.desa_kel,
                    'Tanggal Pengukuran Awal': item.tanggal_pengukuran_awal
                };

                for (let week = 1; week <= 12; week++) {
                    const weekData = item.weeks[week];
                    if (weekData) {
                        row[`BB Week ${week}`] = weekData.bb;
                        row[`TB Week ${week}`] = weekData.tb;
                        if (week > 1) {
                            row[`Delta BB Week ${week}`] = weekData.delta_bb;
                            row[`Delta TB Week ${week}`] = weekData.delta_tb;
                        }
                        row[`ZS-BBU Week ${week}`] = weekData.zs_bbu;
                        row[`ZS-TBU Week ${week}`] = weekData.zs_tbu;
                        row[`ZS-BBTB Week ${week}`] = weekData.zs_bbtb;
                    }
                }

                row['Status Intervensi'] = item.status_intervensi;
                return row;
            });

            const ws = XLSX.utils.json_to_sheet(antropometriRows);
            XLSX.utils.book_append_sheet(wb, ws, 'Antropometri');
        }

        if (selectedReports.includes('konsumsi') && konsumsiData.length > 0) {
            const konsumsiRows = konsumsiData.map((item, idx) => {
                const row: any = {
                    No: idx + 1,
                    Nama: item.nama_balita,
                    NIK: item.nik,
                    JK: item.jk,
                    'Tgl Lahir': item.tgl_lahir,
                    Kec: item.kec,
                    Puskesmas: item.puskesmas,
                    'Desa/Kel': item.desa_kel,
                    'Tanggal Konsumsi Awal': item.tanggal_konsumsi_awal
                };

                for (let week = 0; week <= 12; week++) {
                    const weekData = item.weeks[week];
                    if (weekData) {
                        const label = week === 0 ? 'Awal' : `Week ${week}`;
                        row[`Kepatuhan (%) ${label}`] = weekData.kepatuhan_persen;
                        row[`Status Kesehatan ${label}`] = weekData.status_kesehatan;
                    }
                }

                row['Status Intervensi'] = item.status_intervensi;
                return row;
            });

            const ws = XLSX.utils.json_to_sheet(konsumsiRows);
            XLSX.utils.book_append_sheet(wb, ws, 'Konsumsi');
        }

        if (selectedReports.includes('pemberian') && pemberianData.length > 0) {
            const pemberianRows = pemberianData.map((item, idx) => {
                const row: any = {
                    No: idx + 1,
                    Nama: item.nama_balita,
                    NIK: item.nik,
                    JK: item.jk,
                    'Tgl Lahir': item.tgl_lahir,
                    Kec: item.kec,
                    Puskesmas: item.puskesmas,
                    'Desa/Kel': item.desa_kel,
                    'Tanggal Pemberian Awal': item.tanggal_pemberian_awal,
                    'Dosis Awal (ml)': item.weeks[0]?.jumlah_dosis_ml || '-'
                };

                for (let week = 1; week <= 12; week++) {
                    const weekData = item.weeks[week];
                    row[`Dosis Week ${week} (ml)`] = weekData?.jumlah_dosis_ml || '-';
                }

                row['Status Intervensi'] = item.status_intervensi;
                return row;
            });

            const ws = XLSX.utils.json_to_sheet(pemberianRows);
            XLSX.utils.book_append_sheet(wb, ws, 'Pemberian');
        }

        const filename = `Riwayat_Intervensi_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <div style={{ width: 40, height: 40, border: '4px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const reportTypes = [
        { key: 'antropometri', label: 'Status Gizi', subtitle: 'Laporan Antropometri', icon: '📊', color: '#3b82f6', bgColor: '#dbeafe' },
        { key: 'konsumsi', label: 'Konsumsi PKMK', subtitle: 'Catatan Makan Harian', icon: '🍽️', color: '#f59e0b', bgColor: '#fef3c7' },
        { key: 'pemberian', label: 'Pemberian PKMK', subtitle: 'Log Distribusi Makanan', icon: '📦', color: '#8b5cf6', bgColor: '#ede9fe' },
    ];

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>
            {/* Breadcrumbs */}
            <nav style={{ display: 'flex', gap: 8, fontSize: 14, marginBottom: 20 }}>
                <Link href="/dashboard" style={{ color: '#61897c', fontWeight: 500, textDecoration: 'none' }}>Home</Link>
                <span style={{ color: '#d1d5db' }}>/</span>
                <Link href="/rekap-laporan" style={{ color: '#61897c', fontWeight: 500, textDecoration: 'none' }}>Laporan</Link>
                <span style={{ color: '#d1d5db' }}>/</span>
                <span style={{ color: '#111816', fontWeight: 600 }}>Riwayat Intervensi</span>
            </nav>

            {/* Page Heading */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 24 }}>
                <div style={{ maxWidth: 600 }}>
                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#111816', margin: 0, letterSpacing: '-0.02em' }}>
                        📋 Daftar Riwayat Intervensi
                    </h1>
                    <p style={{ color: '#61897c', fontSize: 15, marginTop: 8 }}>
                        Lihat dan unduh riwayat lengkap intervensi 12 minggu per balita di Kabupaten Malang.
                    </p>
                </div>
                <button
                    onClick={downloadExcel}
                    disabled={dataLoading}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8, height: 48, padding: '0 24px',
                        background: 'linear-gradient(to right, #10b981, #14b8a6)', color: 'white',
                        borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
                        opacity: dataLoading ? 0.6 : 1
                    }}
                >
                    📥 Download Excel
                </button>
            </div>

            {/* Filter Card - Stitch Style */}
            <form onSubmit={applyFilter} style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb', padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #f0f4f3', paddingBottom: 16, marginBottom: 20 }}>
                    <span style={{ fontSize: 20 }}>🔍</span>
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111816', margin: 0 }}>Filter Data</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }} className="filter-grid-4">
                    {/* Kecamatan */}
                    {user?.role === 'superadmin' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#111816' }}>Kecamatan</label>
                            <select value={kec} onChange={(e) => setKec(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 8, border: '1px solid #dbe6e2', background: 'white', padding: '0 12px', fontSize: 14 }}>
                                <option value="">Semua Kecamatan</option>
                                {kecList.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Puskesmas */}
                    {user?.role === 'superadmin' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{ fontSize: 14, fontWeight: 600, color: '#111816' }}>Puskesmas</label>
                            <select value={puskesmasId} onChange={(e) => setPuskesmasId(e.target.value)} disabled={!kec} style={{ width: '100%', height: 44, borderRadius: 8, border: '1px solid #dbe6e2', background: !kec ? '#f9fafb' : 'white', padding: '0 12px', fontSize: 14 }}>
                                <option value="">{kec ? 'Semua Puskesmas' : 'Pilih Kecamatan Dulu'}</option>
                                {pkmList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Desa */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: '#111816' }}>Desa/Kelurahan</label>
                        <select value={desa} onChange={(e) => setDesa(e.target.value)} disabled={!puskesmasId} style={{ width: '100%', height: 44, borderRadius: 8, border: '1px solid #dbe6e2', background: !puskesmasId ? '#f9fafb' : 'white', padding: '0 12px', fontSize: 14 }}>
                            <option value="">{puskesmasId ? 'Semua Desa' : 'Pilih Puskesmas Dulu'}</option>
                            {desaList.map(d => <option key={d.id} value={d.desa_kel}>{d.desa_kel}</option>)}
                        </select>
                    </div>

                    {/* Tahun */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: '#111816' }}>Tahun</label>
                        <select value={tahun} onChange={(e) => setTahun(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 8, border: '1px solid #dbe6e2', background: 'white', padding: '0 12px', fontSize: 14 }}>
                            <option value="">Semua</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'flex-end' }} className="filter-grid-3">
                    {/* Bulan */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: '#111816' }}>Bulan Mulai</label>
                        <select value={bulan} onChange={(e) => setBulan(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 8, border: '1px solid #dbe6e2', background: 'white', padding: '0 12px', fontSize: 14 }}>
                            <option value="">Semua Bulan</option>
                            {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                                <option key={i + 1} value={String(i + 1)}>{m}</option>
                            ))}
                        </select>
                    </div>

                    {/* NIK Search */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 14, fontWeight: 600, color: '#111816' }}>Cari Balita</label>
                        <input
                            type="text"
                            value={nik}
                            onChange={(e) => setNik(e.target.value)}
                            placeholder="Masukkan NIK atau Nama..."
                            style={{ width: '100%', height: 44, borderRadius: 8, border: '1px solid #dbe6e2', background: '#f8faf9', padding: '0 12px', fontSize: 14 }}
                        />
                    </div>

                    {/* Apply Button */}
                    <button type="submit" style={{ height: 44, padding: '0 24px', background: '#10b981', color: 'white', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        ✓ Terapkan Filter
                    </button>
                </div>
            </form>

            {/* Report Type Selection - Stitch Style */}
            <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111816', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    📊 Pilih Jenis Laporan
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="report-grid">
                    {reportTypes.map(report => {
                        const isSelected = selectedReports.includes(report.key);
                        return (
                            <label
                                key={report.key}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 12, cursor: 'pointer',
                                    border: isSelected ? `2px solid ${report.color}` : '1px solid #dbe6e2',
                                    background: isSelected ? report.bgColor : 'white',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => toggleReport(report.key, e.target.checked)}
                                    style={{ width: 20, height: 20, accentColor: report.color }}
                                />
                                <div style={{ width: 40, height: 40, borderRadius: 999, background: report.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                                    {report.icon}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#111816' }}>{report.label}</div>
                                    <div style={{ fontSize: 12, color: '#61897c' }}>{report.subtitle}</div>
                                </div>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Report Tables */}
            {dataLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64, background: 'white', borderRadius: 16 }}>
                    <div style={{ width: 32, height: 32, border: '3px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: 12 }} />
                    <span style={{ color: '#6b7280' }}>Memuat data...</span>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {selectedReports.includes('antropometri') && (
                        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f0f4f3', background: '#fafbfc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 999, background: '#dbeafe', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📊</div>
                                    <div>
                                        <h3 style={{ fontWeight: 700, color: '#111816', margin: 0 }}>Riwayat Status Gizi (Antropometri)</h3>
                                        <p style={{ fontSize: 12, color: '#61897c', margin: 0 }}>Menampilkan BB/TB per minggu</p>
                                    </div>
                                </div>
                                <span style={{ padding: '4px 12px', background: '#dbeafe', color: '#1d4ed8', fontSize: 12, fontWeight: 700, borderRadius: 999 }}>
                                    {antropometriData.length} Data
                                </span>
                            </div>
                            {antropometriData.length === 0 ? (
                                <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
                                    <p style={{ fontSize: 14 }}>Tidak ada data. Silakan terapkan filter.</p>
                                </div>
                            ) : (
                                <div style={{ padding: 24 }}>
                                    <AntropometriTable data={antropometriData} />
                                </div>
                            )}
                        </div>
                    )}

                    {selectedReports.includes('konsumsi') && (
                        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f0f4f3', background: '#fafbfc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 999, background: '#fef3c7', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🍽️</div>
                                    <div>
                                        <h3 style={{ fontWeight: 700, color: '#111816', margin: 0 }}>Report Konsumsi PKMK</h3>
                                        <p style={{ fontSize: 12, color: '#61897c', margin: 0 }}>Catatan makan harian</p>
                                    </div>
                                </div>
                                <span style={{ padding: '4px 12px', background: '#fef3c7', color: '#b45309', fontSize: 12, fontWeight: 700, borderRadius: 999 }}>
                                    {konsumsiData.length} Data
                                </span>
                            </div>
                            {konsumsiData.length === 0 ? (
                                <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
                                    <p style={{ fontSize: 14 }}>Tidak ada data. Silakan terapkan filter.</p>
                                </div>
                            ) : (
                                <div style={{ padding: 24 }}>
                                    <KonsumsiTable data={konsumsiData} />
                                </div>
                            )}
                        </div>
                    )}

                    {selectedReports.includes('pemberian') && (
                        <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #f0f4f3', background: '#fafbfc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 999, background: '#ede9fe', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                                    <div>
                                        <h3 style={{ fontWeight: 700, color: '#111816', margin: 0 }}>Report Pemberian PKMK</h3>
                                        <p style={{ fontSize: 12, color: '#61897c', margin: 0 }}>Log distribusi makanan</p>
                                    </div>
                                </div>
                                <span style={{ padding: '4px 12px', background: '#ede9fe', color: '#7c3aed', fontSize: 12, fontWeight: 700, borderRadius: 999 }}>
                                    {pemberianData.length} Data
                                </span>
                            </div>
                            {pemberianData.length === 0 ? (
                                <div style={{ padding: 48, textAlign: 'center', color: '#9ca3af' }}>
                                    <p style={{ fontSize: 14 }}>Tidak ada data. Silakan terapkan filter.</p>
                                </div>
                            ) : (
                                <div style={{ padding: 24 }}>
                                    <PemberianTable data={pemberianData} />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @media (max-width: 1024px) {
                    .filter-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
                    .filter-grid-3 { grid-template-columns: 1fr !important; }
                    .report-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    .filter-grid-4 { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
}
