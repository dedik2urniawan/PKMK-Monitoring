"use client";
import { useEffect, useState } from "react";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import { BarChart3, Download, Filter, CheckCircle, AlertTriangle, XCircle, ArrowDownCircle, ArrowUpCircle, History, FileSpreadsheet } from "lucide-react";
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

    // Rekap data
    const [rekapData, setRekapData] = useState<RekapItem[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [puskesmasList, setPuskesmasList] = useState<Puskesmas[]>([]);

    // History data
    const [historyData, setHistoryData] = useState<TransaksiItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Filter rekap
    const [tahun, setTahun] = useState(new Date().getFullYear().toString());
    const [bulan, setBulan] = useState((new Date().getMonth() + 1).toString());
    const [filterPuskesmas, setFilterPuskesmas] = useState("");

    // Filter history
    const [historyPuskesmas, setHistoryPuskesmas] = useState("");
    const [historyTipe, setHistoryTipe] = useState("");
    const [historyLimit, setHistoryLimit] = useState("100");

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aman': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><CheckCircle size={12} />Aman</span>;
            case 'menipis': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700"><AlertTriangle size={12} />Menipis</span>;
            case 'habis': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle size={12} />Habis</span>;
            default: return null;
        }
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

    if (loading && !rekapData.length) return <div className="p-6">Memuat...</div>;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <BarChart3 className="text-purple-600" size={32} />
                    <h1 className="text-3xl font-bold text-gray-800">Rekap Logistik PKMK</h1>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-gray-200">
                <button onClick={() => setActiveTab('rekap')} className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium ${activeTab === 'rekap' ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <FileSpreadsheet size={18} /> Rekap Stok
                </button>
                <button onClick={() => { setActiveTab('history'); if (historyData.length === 0) loadHistory(); }} className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors font-medium ${activeTab === 'history' ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <History size={18} /> Riwayat Transaksi
                </button>
            </div>

            {/* TAB: REKAP STOK */}
            {activeTab === 'rekap' && (
                <>
                    {/* Filter */}
                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Filter size={16} /> Filter:</div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Tahun *</label>
                                <select className="input text-sm" value={tahun} onChange={(e) => setTahun(e.target.value)}>
                                    <option value="2024">2024</option><option value="2025">2025</option><option value="2026">2026</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Bulan *</label>
                                <select className="input text-sm" value={bulan} onChange={(e) => setBulan(e.target.value)}>
                                    {bulanOptions.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                                </select>
                            </div>
                            {user?.role === 'superadmin' && (
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Puskesmas</label>
                                    <select className="input text-sm" value={filterPuskesmas} onChange={(e) => setFilterPuskesmas(e.target.value)}>
                                        <option value="">-- Semua --</option>
                                        {puskesmasList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                                    </select>
                                </div>
                            )}
                            <button onClick={loadRekap} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">Terapkan</button>
                            <button onClick={handleExportExcel} disabled={rekapData.length === 0} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium">
                                <Download size={16} /> Excel
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    {summary && (
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                            <div className="bg-white p-4 rounded-xl border-2 border-blue-100 shadow-sm"><p className="text-xs text-gray-500">Total Stok</p><p className="text-2xl font-bold text-blue-700">{summary.total_stok.toLocaleString()}</p></div>
                            <div className="bg-white p-4 rounded-xl border-2 border-emerald-100 shadow-sm"><p className="text-xs text-gray-500">Masuk Periode</p><p className="text-2xl font-bold text-emerald-700">+{summary.total_masuk.toLocaleString()}</p></div>
                            <div className="bg-white p-4 rounded-xl border-2 border-red-100 shadow-sm"><p className="text-xs text-gray-500">Keluar Periode</p><p className="text-2xl font-bold text-red-700">-{summary.total_keluar.toLocaleString()}</p></div>
                            <div className="bg-white p-4 rounded-xl border-2 border-emerald-100 shadow-sm"><p className="text-xs text-gray-500">Stok Aman</p><p className="text-2xl font-bold text-emerald-700">{summary.count_aman}</p></div>
                            <div className="bg-white p-4 rounded-xl border-2 border-amber-100 shadow-sm"><p className="text-xs text-gray-500">Stok Menipis</p><p className="text-2xl font-bold text-amber-700">{summary.count_menipis}</p></div>
                            <div className="bg-white p-4 rounded-xl border-2 border-red-100 shadow-sm"><p className="text-xs text-gray-500">Stok Habis</p><p className="text-2xl font-bold text-red-700">{summary.count_habis}</p></div>
                        </div>
                    )}

                    {/* Rekap Table */}
                    <div className="overflow-x-auto rounded-xl border-2 border-gray-200 shadow-sm bg-white">
                        <table className="w-full text-sm border-collapse">
                            <thead className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2 border-purple-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-purple-200">No</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-purple-200">Puskesmas</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-purple-200">Merk PKMK</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-purple-200">Kategori</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-purple-200">Stok</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-purple-200">Min</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-purple-200 bg-emerald-50">Masuk</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-purple-200 bg-red-50">Keluar</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-purple-200">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rekapData.length === 0 ? (
                                    <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Pilih periode dan terapkan filter untuk melihat rekap.</td></tr>
                                ) : (
                                    rekapData.map((item, idx) => (
                                        <tr key={`${item.puskesmas_id}-${item.jenis_pkmk_id}`} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-4 py-3 border border-gray-100">{idx + 1}</td>
                                            <td className="px-4 py-3 font-semibold border border-gray-100">{item.puskesmas_nama}</td>
                                            <td className="px-4 py-3 border border-gray-100">{item.merk}</td>
                                            <td className="px-4 py-3 text-center border border-gray-100">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.kategori_usia === 'bayi' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {item.kategori_usia === 'bayi' ? '0-11' : '12-59'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold border border-gray-100">{item.stok_saat_ini.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center text-gray-500 border border-gray-100">{item.stok_minimum}</td>
                                            <td className="px-4 py-3 text-center font-bold text-emerald-700 bg-emerald-50/50 border border-gray-100">+{item.masuk_periode}</td>
                                            <td className="px-4 py-3 text-center font-bold text-red-700 bg-red-50/50 border border-gray-100">-{item.keluar_periode}</td>
                                            <td className="px-4 py-3 text-center border border-gray-100">{getStatusBadge(item.status)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* TAB: RIWAYAT TRANSAKSI */}
            {activeTab === 'history' && (
                <>
                    {/* Filter History */}
                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Filter size={16} /> Filter:</div>
                            {user?.role === 'superadmin' && (
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1">Puskesmas</label>
                                    <select className="input text-sm" value={historyPuskesmas} onChange={(e) => setHistoryPuskesmas(e.target.value)}>
                                        <option value="">-- Semua --</option>
                                        {puskesmasList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Tipe</label>
                                <select className="input text-sm" value={historyTipe} onChange={(e) => setHistoryTipe(e.target.value)}>
                                    <option value="">-- Semua --</option>
                                    <option value="masuk_dinas">Masuk dari Dinas</option>
                                    <option value="masuk_beli">Masuk Pembelian</option>
                                    <option value="masuk_transfer">Masuk Transfer</option>
                                    <option value="keluar_pemberian">Keluar Pemberian</option>
                                    <option value="keluar_expired">Keluar Kadaluarsa</option>
                                    <option value="keluar_rusak">Keluar Rusak</option>
                                    <option value="keluar_lainnya">Keluar Lainnya</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 block mb-1">Tampilkan</label>
                                <select className="input text-sm" value={historyLimit} onChange={(e) => setHistoryLimit(e.target.value)}>
                                    <option value="50">50 terakhir</option>
                                    <option value="100">100 terakhir</option>
                                    <option value="200">200 terakhir</option>
                                    <option value="500">500 terakhir</option>
                                </select>
                            </div>
                            <button onClick={loadHistory} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium">Terapkan</button>
                            <button onClick={handleExportHistory} disabled={historyData.length === 0} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium">
                                <Download size={16} /> Excel
                            </button>
                        </div>
                    </div>

                    {/* History Table */}
                    <div className="overflow-x-auto rounded-xl border-2 border-gray-200 shadow-sm bg-white">
                        {historyLoading ? (
                            <div className="p-8 text-center">Memuat riwayat transaksi...</div>
                        ) : (
                            <table className="w-full text-sm border-collapse">
                                <thead className="bg-gradient-to-r from-slate-50 to-gray-100 border-b-2 border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">Tanggal</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">Tipe</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">Puskesmas</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">Merk PKMK</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border border-gray-200">Jumlah</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">Keterangan</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border border-gray-200">No. Batch</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyData.length === 0 ? (
                                        <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Belum ada riwayat transaksi.</td></tr>
                                    ) : (
                                        historyData.map((item) => (
                                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="px-4 py-3 border border-gray-100 font-mono text-xs">{item.tanggal}</td>
                                                <td className="px-4 py-3 border border-gray-100">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${isMasuk(item.tipe_transaksi) ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {isMasuk(item.tipe_transaksi) ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                                                        {getTipeLabel(item.tipe_transaksi)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-semibold border border-gray-100">{item.puskesmas_nama}</td>
                                                <td className="px-4 py-3 border border-gray-100">{item.merk}</td>
                                                <td className={`px-4 py-3 text-center font-bold border border-gray-100 ${isMasuk(item.tipe_transaksi) ? 'text-emerald-700' : 'text-red-700'}`}>
                                                    {item.jumlah > 0 ? '+' : ''}{item.jumlah} kotak
                                                </td>
                                                <td className="px-4 py-3 border border-gray-100 text-gray-600">{item.keterangan || '-'}</td>
                                                <td className="px-4 py-3 border border-gray-100 text-gray-500 font-mono text-xs">{item.no_batch || '-'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            <style jsx>{`.input{width:100%;border:1px solid #d1d5db;border-radius:0.5rem;padding:0.5rem 0.75rem;min-width:120px;}`}</style>
        </div>
    );
}
