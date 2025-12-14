"use client";
import { useEffect, useState } from "react";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import { Filter, Download, Activity, Coffee, Pill, User, MapPin, Calendar, Loader2 } from "lucide-react";
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
                    setKecList(kecData.items || []);
                } else {
                    // For admin_puskesmas, auto-set puskesmas filter
                    setPuskesmasId(userData.user.puskesmas_id);
                    // Fetch puskesmas info to get kecamatan
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
            // Fetch selected reports
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

        // Add Antropometri sheet
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

                // Add week data
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

        // Add Konsumsi sheet
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

                // Add week data
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

        // Add Pemberian sheet
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

                // Add week data
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

        // Download file
        const filename = `Riwayat_Intervensi_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, filename);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="max-w-full mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 text-gray-900">Daftar Riwayat Intervensi</h1>

            {/* Filter Section */}
            <form onSubmit={applyFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border-2 border-emerald-100 shadow-md">
                <div className="col-span-full">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Filter size={16} className="text-emerald-600" />
                        Filter Data Balita
                    </h3>
                </div>

                {/* Kecamatan (Superadmin only) */}
                {user?.role === 'superadmin' && (
                    <div>
                        <label className="text-xs font-medium text-gray-700 mb-1.5 block">Kecamatan</label>
                        <select className="input" value={kec} onChange={(e) => setKec(e.target.value)}>
                            <option value="">-- Kecamatan --</option>
                            {kecList.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                    </div>
                )}

                {/* Puskesmas (Superadmin only) */}
                {user?.role === 'superadmin' && (
                    <div>
                        <label className="text-xs font-medium text-gray-700 mb-1.5 block">Puskesmas</label>
                        <select className="input" value={puskesmasId} onChange={(e) => setPuskesmasId(e.target.value)}>
                            <option value="">-- Puskesmas --</option>
                            {pkmList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                        </select>
                    </div>
                )}

                {/* Desa/Kel */}
                <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">Desa/Kelurahan</label>
                    <select className="input" value={desa} onChange={(e) => setDesa(e.target.value)}>
                        <option value="">-- Desa/Kel --</option>
                        {desaList.map(d => <option key={d.id} value={d.desa_kel}>{d.desa_kel}</option>)}
                    </select>
                </div>

                {/* NIK Search */}
                <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">NIK Balita</label>
                    <input
                        type="text"
                        placeholder="Cari NIK..."
                        className="input"
                        value={nik}
                        onChange={(e) => setNik(e.target.value)}
                    />
                </div>

                {/* Tahun Filter */}
                <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">Tahun</label>
                    <select className="input" value={tahun} onChange={(e) => setTahun(e.target.value)}>
                        <option value="">-- Semua Tahun --</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                    </select>
                </div>

                {/* Bulan Filter */}
                <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">Bulan</label>
                    <select className="input" value={bulan} onChange={(e) => setBulan(e.target.value)}>
                        <option value="">-- Semua Bulan --</option>
                        <option value="1">Januari</option>
                        <option value="2">Februari</option>
                        <option value="3">Maret</option>
                        <option value="4">April</option>
                        <option value="5">Mei</option>
                        <option value="6">Juni</option>
                        <option value="7">Juli</option>
                        <option value="8">Agustus</option>
                        <option value="9">September</option>
                        <option value="10">Oktober</option>
                        <option value="11">November</option>
                        <option value="12">Desember</option>
                    </select>
                </div>

                <div className="col-span-full">
                    <button
                        type="submit"
                        className="w-full sm:w-auto px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                    >
                        Terapkan Filter
                    </button>
                </div>
            </form>

            {/* Report Type Selection */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Pilih Jenis Laporan</h3>
                <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                            checked={selectedReports.includes('antropometri')}
                            onChange={(e) => toggleReport('antropometri', e.target.checked)}
                        />
                        <Activity size={18} className="text-emerald-600" />
                        <span className="text-sm font-medium text-gray-700">Report Status Gizi (Antropometri)</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                            checked={selectedReports.includes('konsumsi')}
                            onChange={(e) => toggleReport('konsumsi', e.target.checked)}
                        />
                        <Coffee size={18} className="text-emerald-600" />
                        <span className="text-sm font-medium text-gray-700">Report Konsumsi PKMK</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                            checked={selectedReports.includes('pemberian')}
                            onChange={(e) => toggleReport('pemberian', e.target.checked)}
                        />
                        <Pill size={18} className="text-emerald-600" />
                        <span className="text-sm font-medium text-gray-700">Report Pemberian PKMK</span>
                    </label>
                </div>
            </div>

            {/* Download Excel Button */}
            {selectedReports.length > 0 && (
                <div className="mb-6">
                    <button
                        onClick={downloadExcel}
                        disabled={dataLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white rounded-lg transition-all font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download size={18} />
                        Download Excel
                    </button>
                </div>
            )}

            {/* Report Tables */}
            {dataLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="animate-spin h-8 w-8 text-emerald-600 mr-3" />
                    <span className="text-gray-600">Memuat data...</span>
                </div>
            ) : (
                <div className="space-y-8">
                    {selectedReports.includes('antropometri') && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Activity className="text-emerald-600" />
                                Report Status Gizi (Antropometri)
                            </h2>
                            {antropometriData.length === 0 ? (
                                <div className="text-gray-500 text-sm py-8 text-center">
                                    Tidak ada data. Silakan terapkan filter.
                                </div>
                            ) : (
                                <>
                                    <div className="text-gray-600 text-sm mb-4">
                                        {antropometriData.length} data ditemukan
                                    </div>
                                    <AntropometriTable data={antropometriData} />
                                </>
                            )}
                        </div>
                    )}

                    {selectedReports.includes('konsumsi') && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Coffee className="text-emerald-600" />
                                Report Konsumsi PKMK
                            </h2>
                            {konsumsiData.length === 0 ? (
                                <div className="text-gray-500 text-sm py-8 text-center">
                                    Tidak ada data. Silakan terapkan filter.
                                </div>
                            ) : (
                                <>
                                    <div className="text-gray-600 text-sm mb-4">
                                        {konsumsiData.length} data ditemukan
                                    </div>
                                    <KonsumsiTable data={konsumsiData} />
                                </>
                            )}
                        </div>
                    )}

                    {selectedReports.includes('pemberian') && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Pill className="text-emerald-600" />
                                Report Pemberian PKMK
                            </h2>
                            {pemberianData.length === 0 ? (
                                <div className="text-gray-500 text-sm py-8 text-center">
                                    Tidak ada data. Silakan terapkan filter.
                                </div>
                            ) : (
                                <>
                                    <div className="text-gray-600 text-sm mb-4">
                                        {pemberianData.length} data ditemukan
                                    </div>
                                    <PemberianTable data={pemberianData} />
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
