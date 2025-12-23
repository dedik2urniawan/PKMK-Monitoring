"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import { Package, ArrowDownCircle, ArrowUpCircle, AlertTriangle, CheckCircle, XCircle, Filter, Pencil, Trash2, Camera, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import StokDistribusiChart from "./components/StokDistribusiChart";
import StokStatusChart from "./components/StokStatusChart";

type AppUser = { role: 'superadmin' | 'admin_puskesmas'; puskesmas_id: string | null };

type StokItem = {
    id: string;
    puskesmas_id: string;
    puskesmas_nama: string;
    jenis_pkmk_id: string;
    merk: string;
    kategori_usia: string;
    rentang_usia: string;
    satuan: string;
    stok_tersedia: number;
    stok_minimum: number;
    status: 'aman' | 'menipis' | 'habis';
};

type JenisPkmk = { id: string; nama_merk: string; kategori_usia: string; rentang_usia: string; satuan: string; };
type Puskesmas = { id: string; nama: string; };

export default function ManajemenLogistikPage() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<AppUser | null>(null);
    const [stokList, setStokList] = useState<StokItem[]>([]);
    const [jenisPkmkList, setJenisPkmkList] = useState<JenisPkmk[]>([]);
    const [puskesmasList, setPuskesmasList] = useState<Puskesmas[]>([]);
    const [filterPuskesmas, setFilterPuskesmas] = useState("");
    const [filterMerk, setFilterMerk] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'masuk' | 'keluar'>('masuk');
    const [mounted, setMounted] = useState(false);
    const [form, setForm] = useState({
        puskesmas_id: '', jenis_pkmk_id: '', tipe_transaksi: 'masuk_dinas',
        jumlah: '', tanggal: new Date().toISOString().slice(0, 10),
        no_batch: '', tanggal_kadaluarsa: '', keterangan: ''
    });
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Transaction history states
    const [transaksiList, setTransaksiList] = useState<any[]>([]);
    const [showRiwayat, setShowRiwayat] = useState(false);
    const [viewFotoUrl, setViewFotoUrl] = useState<string | null>(null);
    const [showFotoModal, setShowFotoModal] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        (async () => {
            try {
                await ensureServerSession();
                const authHeaders = await getAuthHeaders();
                const userRes = await fetch("/api/auth/session", { credentials: 'include', headers: authHeaders });
                const userData = await userRes.json();
                setUser(userData.user);
                if (userData.user?.puskesmas_id) setForm(f => ({ ...f, puskesmas_id: userData.user.puskesmas_id }));
                const jenisPkmkRes = await fetch("/api/ref/jenis-pkmk", { credentials: 'include', headers: authHeaders });
                const jenisPkmkData = await jenisPkmkRes.json();
                setJenisPkmkList(jenisPkmkData.items || []);
                if (userData.user.role === 'superadmin') {
                    const pkmRes = await fetch("/api/ref/puskesmas", { credentials: 'include', headers: authHeaders });
                    const pkmData = await pkmRes.json();
                    setPuskesmasList(pkmData.items || []);
                }
                await loadStok();
                setLoading(false);
            } catch (err) { console.error(err); setLoading(false); }
        })();
    }, []);

    const loadStok = async () => {
        const authHeaders = await getAuthHeaders();
        const res = await fetch("/api/logistik/stok", { credentials: 'include', headers: authHeaders });
        const data = await res.json();
        setStokList(data.items || []);
    };

    const loadTransaksi = async () => {
        const authHeaders = await getAuthHeaders();
        const res = await fetch("/api/logistik/transaksi?limit=50", { credentials: 'include', headers: authHeaders });
        const data = await res.json();
        setTransaksiList(data.items || []);
    };

    const viewFoto = (url: string) => {
        setViewFotoUrl(url);
        setShowFotoModal(true);
    };

    const toggleRiwayat = async () => {
        if (!showRiwayat && transaksiList.length === 0) {
            await loadTransaksi();
        }
        setShowRiwayat(!showRiwayat);
    };

    const openModal = (type: 'masuk' | 'keluar') => {
        setModalType(type);
        setForm(f => ({
            ...f, jenis_pkmk_id: '', jumlah: '', tanggal: new Date().toISOString().slice(0, 10),
            no_batch: '', tanggal_kadaluarsa: '', keterangan: '',
            tipe_transaksi: type === 'masuk' ? 'masuk_dinas' : 'keluar_pemberian'
        }));
        setFotoFile(null);
        setFotoPreview(null);
        setShowModal(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
            toast.error('Format file tidak didukung. Gunakan JPEG, PNG, atau WebP.');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Ukuran file terlalu besar. Maksimal 2MB.');
            return;
        }

        setFotoFile(file);
        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setFotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const removeFoto = () => {
        setFotoFile(null);
        setFotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.jenis_pkmk_id || !form.jumlah) { toast.error("Lengkapi semua field yang wajib"); return; }

        let foto_url = null;

        // Upload foto jika ada
        if (fotoFile) {
            setUploading(true);
            try {
                const formData = new FormData();
                formData.append('file', fotoFile);

                const authHeaders = await getAuthHeaders();
                const uploadRes = await fetch('/api/logistik/upload', {
                    method: 'POST',
                    credentials: 'include',
                    headers: authHeaders,
                    body: formData
                });

                if (!uploadRes.ok) {
                    const err = await uploadRes.json();
                    toast.error(err.error || 'Gagal upload foto');
                    setUploading(false);
                    return;
                }

                const uploadData = await uploadRes.json();
                foto_url = uploadData.url;
            } catch (err) {
                toast.error('Gagal upload foto');
                setUploading(false);
                return;
            }
        }

        const authHeaders = await getAuthHeaders();
        const res = await fetch("/api/logistik/transaksi", {
            method: "POST", credentials: 'include', headers: { ...authHeaders, "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, jumlah: parseInt(form.jumlah), foto_url })
        });
        setUploading(false);
        if (res.ok) {
            toast.success(modalType === 'masuk' ? "Stok masuk berhasil dicatat" : "Stok keluar berhasil dicatat");
            setShowModal(false);
            setFotoFile(null);
            setFotoPreview(null);
            await loadStok();
            if (showRiwayat) await loadTransaksi(); // Refresh riwayat jika sedang ditampilkan
        } else {
            const err = await res.json();
            toast.error(err.error || "Gagal menyimpan transaksi");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aman': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><CheckCircle size={12} />Aman</span>;
            case 'menipis': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700"><AlertTriangle size={12} />Menipis</span>;
            case 'habis': return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle size={12} />Habis</span>;
            default: return null;
        }
    };

    // Edit Stok
    const [showEditModal, setShowEditModal] = useState(false);
    const [editItem, setEditItem] = useState<StokItem | null>(null);
    const [editForm, setEditForm] = useState({ stok_tersedia: '', stok_minimum: '' });

    const openEdit = (item: StokItem) => {
        setEditItem(item);
        setEditForm({ stok_tersedia: String(item.stok_tersedia), stok_minimum: String(item.stok_minimum) });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editItem) return;
        const authHeaders = await getAuthHeaders();
        const res = await fetch("/api/logistik/stok", {
            method: "POST", credentials: 'include', headers: { ...authHeaders, "Content-Type": "application/json" },
            body: JSON.stringify({ puskesmas_id: editItem.puskesmas_id, jenis_pkmk_id: editItem.jenis_pkmk_id, stok_tersedia: parseInt(editForm.stok_tersedia), stok_minimum: parseInt(editForm.stok_minimum) })
        });
        if (res.ok) {
            toast.success("Stok berhasil diperbarui");
            setShowEditModal(false);
            await loadStok();
        } else {
            toast.error("Gagal memperbarui stok");
        }
    };

    const handleDelete = async (item: StokItem) => {
        if (!confirm(`Hapus stok ${item.merk} dari ${item.puskesmas_nama}? Data transaksi terkait akan tetap ada.`)) return;
        const authHeaders = await getAuthHeaders();
        const res = await fetch(`/api/logistik/stok?id=${item.id}`, { method: "DELETE", credentials: 'include', headers: authHeaders });
        if (res.ok) {
            toast.success("Stok berhasil dihapus");
            await loadStok();
        } else {
            toast.error("Gagal menghapus stok");
        }
    };

    const filteredStok = stokList.filter(s => {
        if (filterPuskesmas && s.puskesmas_id !== filterPuskesmas) return false;
        if (filterMerk && s.jenis_pkmk_id !== filterMerk) return false;
        return true;
    });

    const stats = {
        total: filteredStok.reduce((sum, s) => sum + s.stok_tersedia, 0),
        aman: filteredStok.filter(s => s.status === 'aman').length,
        menipis: filteredStok.filter(s => s.status === 'menipis').length,
        habis: filteredStok.filter(s => s.status === 'habis').length
    };

    // Chart data - distribusi per merk
    const distribusiData = useMemo(() => {
        const merkMap = new Map<string, number>();
        filteredStok.forEach(s => {
            merkMap.set(s.merk, (merkMap.get(s.merk) || 0) + s.stok_tersedia);
        });
        const total = stats.total || 1;
        return Array.from(merkMap.entries()).map(([name, value]) => ({
            name, value, percentage: Math.round((value / total) * 100)
        }));
    }, [filteredStok, stats.total]);

    if (loading) return <div className="p-6">Memuat...</div>;

    return (
        <>
            {/* MODAL - Rendered first at top level with inline styles for guaranteed visibility */}
            {mounted && showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowModal(false)} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '420px' }}>
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '85vh', overflowY: 'auto' }}>
                            <div style={{ padding: '16px', backgroundColor: modalType === 'masuk' ? '#059669' : '#dc2626', color: 'white', borderRadius: '16px 16px 0 0' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                    {modalType === 'masuk' ? <ArrowDownCircle size={20} /> : <ArrowUpCircle size={20} />}
                                    {modalType === 'masuk' ? 'Catat Stok Masuk' : 'Catat Stok Keluar'}
                                </h2>
                            </div>
                            <form onSubmit={handleSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {user?.role === 'superadmin' && (
                                    <div>
                                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Puskesmas *</label>
                                        <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px' }} value={form.puskesmas_id} onChange={(e) => setForm({ ...form, puskesmas_id: e.target.value })} required>
                                            <option value="">-- Pilih --</option>
                                            {puskesmasList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Merk PKMK *</label>
                                    <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px' }} value={form.jenis_pkmk_id} onChange={(e) => setForm({ ...form, jenis_pkmk_id: e.target.value })} required>
                                        <option value="">-- Pilih --</option>
                                        {jenisPkmkList.map(j => <option key={j.id} value={j.id}>{j.nama_merk} ({j.rentang_usia})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Tipe Transaksi *</label>
                                    <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px' }} value={form.tipe_transaksi} onChange={(e) => setForm({ ...form, tipe_transaksi: e.target.value })} required>
                                        {modalType === 'masuk' ? (<><option value="masuk_dinas">Masuk dari Dinas</option><option value="masuk_beli">Masuk Pembelian</option><option value="masuk_transfer">Masuk Transfer</option></>) : (<><option value="keluar_pemberian">Keluar Pemberian</option><option value="keluar_expired">Keluar Kadaluarsa</option><option value="keluar_rusak">Keluar Rusak</option><option value="keluar_lainnya">Keluar Lainnya</option></>)}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Jumlah (kotak) *</label>
                                        <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', boxSizing: 'border-box' }} value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value })} placeholder="0" min="1" required />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Tanggal *</label>
                                        <input type="date" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', boxSizing: 'border-box' }} value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} required />
                                    </div>
                                </div>
                                {modalType === 'masuk' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>No. Batch</label>
                                            <input type="text" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', boxSizing: 'border-box' }} value={form.no_batch} onChange={(e) => setForm({ ...form, no_batch: e.target.value })} placeholder="Opsional" />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Tgl Kadaluarsa</label>
                                            <input type="date" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', boxSizing: 'border-box' }} value={form.tanggal_kadaluarsa} onChange={(e) => setForm({ ...form, tanggal_kadaluarsa: e.target.value })} />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Keterangan</label>
                                    <input type="text" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', boxSizing: 'border-box' }} value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="Opsional" />
                                </div>

                                {/* Upload Foto */}
                                <div>
                                    <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>
                                        Foto Bukti <span style={{ color: '#9ca3af', fontWeight: '400' }}>(Opsional, max 2MB)</span>
                                    </label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/jpg"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                    {!fotoPreview ? (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{
                                                width: '100%',
                                                padding: '16px',
                                                border: '2px dashed #d1d5db',
                                                borderRadius: '8px',
                                                backgroundColor: '#f9fafb',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '8px',
                                                color: '#6b7280'
                                            }}
                                        >
                                            <Camera size={24} />
                                            <span style={{ fontSize: '13px' }}>Klik untuk pilih foto</span>
                                        </button>
                                    ) : (
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <img
                                                src={fotoPreview}
                                                alt="Preview"
                                                style={{
                                                    width: '100%',
                                                    maxHeight: '150px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                    border: '1px solid #d1d5db'
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={removeFoto}
                                                style={{
                                                    position: 'absolute',
                                                    top: '4px',
                                                    right: '4px',
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#ef4444',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <X size={14} color="white" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', backgroundColor: 'white' }} disabled={uploading}>Batal</button>
                                    <button type="submit" disabled={uploading} style={{ padding: '8px 24px', color: 'white', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', border: 'none', backgroundColor: modalType === 'masuk' ? '#059669' : '#dc2626', opacity: uploading ? 0.6 : 1 }}>
                                        {uploading ? 'Mengupload...' : 'Simpan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT STOK MODAL */}
            {mounted && showEditModal && editItem && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowEditModal(false)} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '380px' }}>
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <div style={{ padding: '16px', backgroundColor: '#0ea5e9', color: 'white', borderRadius: '16px 16px 0 0' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                    <Pencil size={20} /> Edit Stok
                                </h2>
                            </div>
                            <form onSubmit={handleEditSubmit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#374151' }}>{editItem.merk}</p>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>{editItem.puskesmas_nama} • {editItem.rentang_usia}</p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div>
                                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Stok Tersedia *</label>
                                        <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', boxSizing: 'border-box' }} value={editForm.stok_tersedia} onChange={(e) => setEditForm({ ...editForm, stok_tersedia: e.target.value })} min="0" required />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Stok Minimum *</label>
                                        <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', boxSizing: 'border-box' }} value={editForm.stok_minimum} onChange={(e) => setEditForm({ ...editForm, stok_minimum: e.target.value })} min="0" required />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                                    <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', backgroundColor: 'white' }}>Batal</button>
                                    <button type="submit" style={{ padding: '8px 24px', color: 'white', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', border: 'none', backgroundColor: '#0ea5e9' }}>Simpan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT */}
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <Package className="text-emerald-600" size={32} />
                        <h1 className="text-3xl font-bold text-gray-800">Manajemen Logistik PKMK</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => openModal('masuk')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">
                            <ArrowDownCircle size={18} /> Stok Masuk
                        </button>
                        <button onClick={() => openModal('keluar')} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
                            <ArrowUpCircle size={18} /> Stok Keluar
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border-2 border-blue-100 shadow-sm"><p className="text-sm text-gray-500">Total Stok</p><p className="text-3xl font-bold text-blue-700">{stats.total.toLocaleString()}</p></div>
                    <div className="bg-white p-4 rounded-xl border-2 border-emerald-100 shadow-sm"><p className="text-sm text-gray-500">Stok Aman</p><p className="text-3xl font-bold text-emerald-700">{stats.aman}</p></div>
                    <div className="bg-white p-4 rounded-xl border-2 border-amber-100 shadow-sm"><p className="text-sm text-gray-500">Stok Menipis</p><p className="text-3xl font-bold text-amber-700">{stats.menipis}</p></div>
                    <div className="bg-white p-4 rounded-xl border-2 border-red-100 shadow-sm"><p className="text-sm text-gray-500">Stok Habis</p><p className="text-3xl font-bold text-red-700">{stats.habis}</p></div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StokDistribusiChart data={distribusiData} total={stats.total} loading={loading} />
                    <StokStatusChart aman={stats.aman} menipis={stats.menipis} habis={stats.habis} loading={loading} />
                </div>
                <div className="flex flex-wrap items-end gap-4 bg-white p-4 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700"><Filter size={16} /> Filter:</div>
                    {user?.role === 'superadmin' && (
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">Puskesmas</label>
                            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filterPuskesmas} onChange={(e) => setFilterPuskesmas(e.target.value)}>
                                <option value="">-- Semua --</option>
                                {puskesmasList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Merk PKMK</label>
                        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filterMerk} onChange={(e) => setFilterMerk(e.target.value)}>
                            <option value="">-- Semua --</option>
                            {jenisPkmkList.map(j => <option key={j.id} value={j.id}>{j.nama_merk}</option>)}
                        </select>
                    </div>
                    <button onClick={() => loadStok()} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">Refresh</button>
                </div>
                <div className="overflow-x-auto rounded-xl border-2 border-gray-200 shadow-sm bg-white">
                    <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border-r border-gray-200">No</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border-r border-gray-200">Puskesmas</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 border-r border-gray-200">Merk PKMK</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border-r border-gray-200">Kategori</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border-r border-gray-200">Stok Tersedia</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border-r border-gray-200">Stok Minimum</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 border-r border-gray-200">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStok.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Belum ada data stok. Klik "Stok Masuk" untuk menambahkan.</td></tr>
                            ) : (
                                filteredStok.map((item, idx) => (
                                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-3 border-r border-gray-100">{idx + 1}</td>
                                        <td className="px-4 py-3 font-semibold border-r border-gray-100">{item.puskesmas_nama}</td>
                                        <td className="px-4 py-3 border-r border-gray-100">{item.merk}</td>
                                        <td className="px-4 py-3 text-center border-r border-gray-100">
                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${item.kategori_usia === 'bayi' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>{item.rentang_usia}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold border-r border-gray-100">{item.stok_tersedia.toLocaleString()} kotak</td>
                                        <td className="px-4 py-3 text-center text-gray-500 border-r border-gray-100">{item.stok_minimum}</td>
                                        <td className="px-4 py-3 text-center border-r border-gray-100">{getStatusBadge(item.status)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Pencil size={16} /></button>
                                                <button onClick={() => handleDelete(item)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RIWAYAT TRANSAKSI SECTION */}
            <div style={{ marginTop: '24px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <button
                    onClick={toggleRiwayat}
                    style={{
                        width: '100%',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#f9fafb',
                        border: 'none',
                        cursor: 'pointer',
                        borderBottom: showRiwayat ? '1px solid #e5e7eb' : 'none'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Package size={20} style={{ color: '#6b7280' }} />
                        <span style={{ fontWeight: '600', color: '#374151' }}>Riwayat Transaksi (50 Terbaru)</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{showRiwayat ? '▲ Tutup' : '▼ Buka'}</span>
                </button>

                {showRiwayat && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f3f4f6' }}>
                                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Tanggal</th>
                                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Merk</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Tipe</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Jumlah</th>
                                    <th style={{ padding: '10px', textAlign: 'left', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Keterangan</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Foto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transaksiList.length === 0 ? (
                                    <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>Belum ada riwayat transaksi</td></tr>
                                ) : (
                                    transaksiList.map((tx: any) => (
                                        <tr key={tx.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                            <td style={{ padding: '10px', color: '#374151' }}>
                                                {new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '10px', fontWeight: '500', color: '#374151' }}>{tx.merk}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    backgroundColor: tx.tipe_transaksi?.startsWith('masuk') ? '#d1fae5' : '#fee2e2',
                                                    color: tx.tipe_transaksi?.startsWith('masuk') ? '#047857' : '#dc2626'
                                                }}>
                                                    {tx.tipe_transaksi?.replace('_', ' ').replace('masuk', 'Masuk').replace('keluar', 'Keluar')}
                                                </span>
                                            </td>
                                            <td style={{
                                                padding: '10px',
                                                textAlign: 'center',
                                                fontWeight: '600',
                                                color: tx.jumlah > 0 ? '#047857' : '#dc2626'
                                            }}>
                                                {tx.jumlah > 0 ? '+' : ''}{tx.jumlah}
                                            </td>
                                            <td style={{ padding: '10px', color: '#6b7280', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {tx.keterangan || '-'}
                                            </td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                                {tx.foto_url ? (
                                                    <button
                                                        onClick={() => viewFoto(tx.foto_url)}
                                                        style={{
                                                            padding: '4px 10px',
                                                            backgroundColor: '#eff6ff',
                                                            color: '#2563eb',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '11px',
                                                            fontWeight: '500',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}
                                                    >
                                                        <ImageIcon size={12} /> Lihat
                                                    </button>
                                                ) : (
                                                    <span style={{ color: '#d1d5db', fontSize: '11px' }}>-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* FOTO VIEWER MODAL */}
            {mounted && showFotoModal && viewFotoUrl && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)' }} onClick={() => setShowFotoModal(false)} />
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <img
                            src={viewFotoUrl}
                            alt="Foto Dokumentasi"
                            style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
                        />
                        <button
                            onClick={() => setShowFotoModal(false)}
                            style={{
                                position: 'absolute',
                                top: '-12px',
                                right: '-12px',
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                backgroundColor: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                        >
                            <X size={20} color="#374151" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
