"use client";
import { useEffect, useState } from "react";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import { Filter, Download, BarChart3 } from "lucide-react";
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

    const [kec, setKec] = useState("");
    const [puskesmasId, setPuskesmasId] = useState("");
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
            setPuskesmasId("");
        })();
    }, [kec, user]);

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

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Rekap Laporan");

        const fileName = `Rekap_Laporan_${tahun}_${bulan}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    if (loading) return <div className="p-6">Memuat...</div>;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BarChart3 className="text-emerald-600" size={32} />
                    <h1 className="text-3xl font-bold text-gray-800">Rekap Laporan Balita Stunting</h1>
                </div>
                {rekapData.length > 0 && (
                    <button
                        onClick={downloadExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                    >
                        <Download size={18} />
                        Download Excel
                    </button>
                )}
            </div>

            {/* Filter Form */}
            <form onSubmit={applyFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border-2 border-emerald-100 shadow-md">
                <div className="col-span-full">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Filter size={16} className="text-emerald-600" />
                        Filter Periode Laporan
                    </h3>
                </div>

                {/* Kecamatan (Superadmin only) */}
                {user?.role === 'superadmin' && (
                    <div>
                        <label className="text-xs font-medium text-gray-700 mb-1.5 block">Kecamatan</label>
                        <select className="input" value={kec} onChange={(e) => setKec(e.target.value)}>
                            <option value="">-- Semua Kecamatan --</option>
                            {kecList.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                    </div>
                )}

                {/* Puskesmas (Superadmin only) */}
                {user?.role === 'superadmin' && (
                    <div>
                        <label className="text-xs font-medium text-gray-700 mb-1.5 block">Puskesmas</label>
                        <select className="input" value={puskesmasId} onChange={(e) => setPuskesmasId(e.target.value)}>
                            <option value="">-- Semua Puskesmas --</option>
                            {pkmList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                        </select>
                    </div>
                )}

                {/* Tahun */}
                <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">Tahun *</label>
                    <select className="input" value={tahun} onChange={(e) => setTahun(e.target.value)} required>
                        <option value="">-- Pilih Tahun --</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                    </select>
                </div>

                {/* Bulan */}
                <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">Bulan *</label>
                    <select className="input" value={bulan} onChange={(e) => setBulan(e.target.value)} required>
                        <option value="">-- Pilih Bulan --</option>
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
                        disabled={dataLoading}
                    >
                        {dataLoading ? "Memuat..." : "Terapkan Filter"}
                    </button>
                </div>
            </form>

            {/* Report Table */}
            {rekapData.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border-2 border-gray-200 shadow-sm bg-white">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                            <tr>
                                <th rowSpan={2} className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200">No</th>
                                <th rowSpan={2} className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">Puskesmas</th>
                                <th colSpan={3} className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200 bg-blue-50">Balita Stunting</th>
                                <th colSpan={2} className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200 bg-purple-50">Status Bulan ini</th>
                                <th colSpan={6} className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200 bg-amber-50">Selesai Dipantau Bulan ini (Hasil status gizi akhir)</th>
                            </tr>
                            <tr>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200 bg-blue-50">Jumlah Sasaran Balita</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200 bg-blue-50">Jumlah Balita Diberi PKMK Bulan ini</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200 bg-blue-50">PKMK Belum Selesai Bulan Ini</th>

                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200 bg-purple-50">Dropout Bulan ini</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200 bg-purple-50">PKMK Selesai Sampai Bulan ini</th>

                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200 bg-amber-50">Gizi Buruk</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200 bg-amber-50">Gizi Kurang</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200 bg-amber-50">Stunted</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200 bg-amber-50">Severe Stunted</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200 bg-amber-50">Underweight</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200 bg-amber-50">Severe Underweight</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rekapData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="px-4 py-3 text-center border border-gray-200">{idx + 1}</td>
                                    <td className="px-4 py-3 font-semibold text-gray-900 border border-gray-200">{item.puskesmas}</td>
                                    <td className="px-4 py-3 text-center font-bold text-blue-900 border border-gray-200">{item.jumlah_sasaran}</td>
                                    <td className="px-4 py-3 text-center border border-gray-200">{item.diberi_pkmk_bulan_ini}</td>
                                    <td className="px-4 py-3 text-center border border-gray-200">{item.belum_selesai}</td>
                                    <td className="px-4 py-3 text-center border border-gray-200">{item.dropout}</td>
                                    <td className="px-4 py-3 text-center font-bold text-emerald-700 border border-gray-200">{item.selesai_sampai_bulan_ini}</td>
                                    <td className="px-4 py-3 text-center border border-gray-200">{item.status_gizi.gizi_buruk}</td>
                                    <td className="px-4 py-3 text-center border border-gray-200">{item.status_gizi.gizi_kurang}</td>
                                    <td className="px-4 py-3 text-center border border-gray-200">{item.status_gizi.stunted}</td>
                                    <td className="px-4 py-3 text-center border border-gray-200">{item.status_gizi.severe_stunted}</td>
                                    <td className="px-4 py-3 text-center border border-gray-200">{item.status_gizi.underweight}</td>
                                    <td className="px-4 py-3 text-center border border-gray-200">{item.status_gizi.severe_underweight}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                !dataLoading && (
                    <div className="bg-white p-12 rounded-xl border-2 border-gray-200 text-center">
                        <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-500">Silakan pilih periode dan terapkan filter untuk melihat rekap laporan</p>
                    </div>
                )
            )}
        </div>
    );
}
