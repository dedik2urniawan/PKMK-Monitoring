"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import { toast } from "sonner";
import { Package, ArrowDownCircle, ArrowUpCircle, AlertTriangle, CheckCircle, XCircle, Filter, Pencil, Trash2, Camera, X, Image as ImageIcon, RefreshCw, History, ChevronDown, Upload, Box, Plus, Minus } from "lucide-react";
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

    const [transaksiList, setTransaksiList] = useState<any[]>([]);
    const [showRiwayat, setShowRiwayat] = useState(false);
    const [viewFotoUrl, setViewFotoUrl] = useState<string | null>(null);
    const [showFotoModal, setShowFotoModal] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editItem, setEditItem] = useState<StokItem | null>(null);
    const [editForm, setEditForm] = useState({ stok_tersedia: '', stok_minimum: '' });

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
                if (jenisPkmkRes.ok) {
                    const jenisPkmkData = await jenisPkmkRes.json();
                    console.log("[Logistik] Jenis PKMK loaded:", jenisPkmkData.items?.length || 0, "items");
                    setJenisPkmkList(jenisPkmkData.items || []);
                } else {
                    console.error("[Logistik] Failed to fetch jenis-pkmk:", jenisPkmkRes.status);
                }
                if (userData.user?.role === 'superadmin') {
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

    const viewFoto = (url: string) => { setViewFotoUrl(url); setShowFotoModal(true); };
    const toggleRiwayat = async () => { if (!showRiwayat && transaksiList.length === 0) await loadTransaksi(); setShowRiwayat(!showRiwayat); };

    const openModal = (type: 'masuk' | 'keluar') => {
        setModalType(type);
        setForm(f => ({ ...f, jenis_pkmk_id: '', jumlah: '', tanggal: new Date().toISOString().slice(0, 10), no_batch: '', tanggal_kadaluarsa: '', keterangan: '', tipe_transaksi: type === 'masuk' ? 'masuk_dinas' : 'keluar_pemberian' }));
        setFotoFile(null); setFotoPreview(null); setShowModal(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) { toast.error('Format file tidak didukung. Gunakan JPEG, PNG, atau WebP.'); return; }
        if (file.size > 2 * 1024 * 1024) { toast.error('Ukuran file terlalu besar. Maksimal 2MB.'); return; }
        setFotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => { setFotoPreview(reader.result as string); };
        reader.readAsDataURL(file);
    };

    const removeFoto = () => { setFotoFile(null); setFotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.jenis_pkmk_id || !form.jumlah) { toast.error("Lengkapi semua field yang wajib"); return; }
        let foto_url = null;
        if (fotoFile) {
            setUploading(true);
            try {
                const formData = new FormData(); formData.append('file', fotoFile);
                const authHeaders = await getAuthHeaders();
                const uploadRes = await fetch('/api/logistik/upload', { method: 'POST', credentials: 'include', headers: authHeaders, body: formData });
                if (!uploadRes.ok) { const err = await uploadRes.json(); toast.error(err.error || 'Gagal upload foto'); setUploading(false); return; }
                const uploadData = await uploadRes.json(); foto_url = uploadData.url;
            } catch { toast.error('Gagal upload foto'); setUploading(false); return; }
        }
        const authHeaders = await getAuthHeaders();
        const res = await fetch("/api/logistik/transaksi", { method: "POST", credentials: 'include', headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ ...form, jumlah: parseInt(form.jumlah), foto_url }) });
        setUploading(false);
        if (res.ok) { toast.success(modalType === 'masuk' ? "Stok masuk berhasil dicatat" : "Stok keluar berhasil dicatat"); setShowModal(false); setFotoFile(null); setFotoPreview(null); await loadStok(); if (showRiwayat) await loadTransaksi(); }
        else { const err = await res.json(); toast.error(err.error || "Gagal menyimpan transaksi"); }
    };

    const openEdit = (item: StokItem) => { setEditItem(item); setEditForm({ stok_tersedia: String(item.stok_tersedia), stok_minimum: String(item.stok_minimum) }); setShowEditModal(true); };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editItem) return;
        const authHeaders = await getAuthHeaders();
        const res = await fetch("/api/logistik/stok", { method: "POST", credentials: 'include', headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ puskesmas_id: editItem.puskesmas_id, jenis_pkmk_id: editItem.jenis_pkmk_id, stok_tersedia: parseInt(editForm.stok_tersedia), stok_minimum: parseInt(editForm.stok_minimum) }) });
        if (res.ok) { toast.success("Stok berhasil diperbarui"); setShowEditModal(false); await loadStok(); }
        else { toast.error("Gagal memperbarui stok"); }
    };

    const handleDelete = async (item: StokItem) => {
        if (!confirm(`Hapus stok ${item.merk} dari ${item.puskesmas_nama}? Data transaksi terkait akan tetap ada.`)) return;
        const authHeaders = await getAuthHeaders();
        const res = await fetch(`/api/logistik/stok?id=${item.id}`, { method: "DELETE", credentials: 'include', headers: authHeaders });
        if (res.ok) { toast.success("Stok berhasil dihapus"); await loadStok(); }
        else { toast.error("Gagal menghapus stok"); }
    };

    const filteredStok = stokList.filter(s => { if (filterPuskesmas && s.puskesmas_id !== filterPuskesmas) return false; if (filterMerk && s.jenis_pkmk_id !== filterMerk) return false; return true; });

    const stats = {
        total: filteredStok.reduce((sum, s) => sum + s.stok_tersedia, 0),
        aman: filteredStok.filter(s => s.status === 'aman').length,
        menipis: filteredStok.filter(s => s.status === 'menipis').length,
        habis: filteredStok.filter(s => s.status === 'habis').length
    };

    const distribusiData = useMemo(() => {
        const merkMap = new Map<string, number>();
        filteredStok.forEach(s => { merkMap.set(s.merk, (merkMap.get(s.merk) || 0) + s.stok_tersedia); });
        const total = stats.total || 1;
        return Array.from(merkMap.entries()).map(([name, value]) => ({ name, value, percentage: Math.round((value / total) * 100) }));
    }, [filteredStok, stats.total]);

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
            <div style={{ width: 40, height: 40, border: '4px solid #10b981', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <>
            {/* MODAL - Stok Masuk/Keluar */}
            {mounted && showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99999 }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowModal(false)} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '480px' }}>
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '85vh', overflowY: 'auto' }}>
                            <div style={{ padding: '16px 24px', background: modalType === 'masuk' ? 'linear-gradient(to right, #10b981, #14b8a6)' : 'linear-gradient(to right, #ef4444, #dc2626)', color: 'white', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {modalType === 'masuk' ? <Plus size={22} /> : <Minus size={22} />}
                                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{modalType === 'masuk' ? 'Catat Stok Masuk' : 'Catat Stok Keluar'}</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8, display: 'flex' }}><X size={22} /></button>
                            </div>
                            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {user?.role === 'superadmin' && (
                                    <div><label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Puskesmas *</label>
                                        <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14 }} value={form.puskesmas_id} onChange={(e) => setForm({ ...form, puskesmas_id: e.target.value })} required>
                                            <option value="">-- Pilih Puskesmas --</option>
                                            {puskesmasList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                                        </select></div>
                                )}
                                <div><label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Merk PKMK *</label>
                                    <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14 }} value={form.jenis_pkmk_id} onChange={(e) => setForm({ ...form, jenis_pkmk_id: e.target.value })} required>
                                        <option value="">-- Pilih Merk --</option>
                                        {jenisPkmkList.map(j => <option key={j.id} value={j.id}>{j.nama_merk} ({j.rentang_usia})</option>)}
                                    </select></div>
                                <div><label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Tipe Transaksi *</label>
                                    <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14 }} value={form.tipe_transaksi} onChange={(e) => setForm({ ...form, tipe_transaksi: e.target.value })} required>
                                        {modalType === 'masuk' ? (<><option value="masuk_dinas">Masuk dari Dinas</option><option value="masuk_beli">Masuk Pembelian</option><option value="masuk_transfer">Masuk Transfer</option></>) : (<><option value="keluar_pemberian">Keluar Pemberian</option><option value="keluar_expired">Keluar Kadaluarsa</option><option value="keluar_rusak">Keluar Rusak</option><option value="keluar_lainnya">Keluar Lainnya</option></>)}
                                    </select></div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div><label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Jumlah (kotak) *</label>
                                        <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value })} placeholder="0" min="1" required /></div>
                                    <div><label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Tanggal *</label>
                                        <input type="date" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} required /></div>
                                </div>
                                {modalType === 'masuk' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div><label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>No. Batch</label>
                                            <input type="text" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} value={form.no_batch} onChange={(e) => setForm({ ...form, no_batch: e.target.value })} placeholder="Opsional" /></div>
                                        <div><label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Tgl Kadaluarsa</label>
                                            <input type="date" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} value={form.tanggal_kadaluarsa} onChange={(e) => setForm({ ...form, tanggal_kadaluarsa: e.target.value })} /></div>
                                    </div>
                                )}
                                <div><label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Keterangan</label>
                                    <input type="text" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="Opsional" /></div>
                                <div><label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Foto Bukti <span style={{ color: '#9ca3af', fontWeight: 400 }}>(Opsional, max 2MB)</span></label>
                                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/jpg" onChange={handleFileChange} style={{ display: 'none' }} />
                                    {!fotoPreview ? (
                                        <button type="button" onClick={() => fileInputRef.current?.click()} style={{ width: '100%', padding: 20, border: '2px dashed #d1d5db', borderRadius: 12, background: modalType === 'masuk' ? '#ecfdf5' : '#fef2f2', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: modalType === 'masuk' ? '#059669' : '#dc2626' }}>
                                            <Upload size={24} /><span style={{ fontSize: 13, fontWeight: 500 }}>Klik untuk upload foto</span>
                                        </button>
                                    ) : (
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <img src={fotoPreview} alt="Preview" style={{ width: '100%', maxHeight: 150, objectFit: 'cover', borderRadius: 8, border: '1px solid #d1d5db' }} />
                                            <button type="button" onClick={removeFoto} style={{ position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: '50%', backgroundColor: '#ef4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                                    <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 600, cursor: 'pointer', backgroundColor: 'white', fontSize: 14 }} disabled={uploading}>Batal</button>
                                    <button type="submit" disabled={uploading} style={{ padding: '10px 24px', color: 'white', borderRadius: 8, fontWeight: 600, cursor: 'pointer', border: 'none', background: modalType === 'masuk' ? 'linear-gradient(to right, #10b981, #14b8a6)' : 'linear-gradient(to right, #ef4444, #dc2626)', fontSize: 14, opacity: uploading ? 0.6 : 1, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                                        {uploading ? 'Mengupload...' : (modalType === 'masuk' ? 'Simpan Masuk' : 'Simpan Keluar')}
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
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '400px' }}>
                        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                            <div style={{ padding: '16px 24px', background: 'linear-gradient(to right, #3b82f6, #2563eb)', color: 'white', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><Pencil size={20} /><h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Edit Stok Manual</h2></div>
                                <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8, display: 'flex' }}><X size={22} /></button>
                            </div>
                            <form onSubmit={handleEditSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div style={{ padding: 12, backgroundColor: '#eff6ff', borderRadius: 8 }}>
                                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e40af' }}>{editItem.merk}</p>
                                    <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#3b82f6' }}>{editItem.puskesmas_nama} • {editItem.rentang_usia}</p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div><label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Stok Tersedia *</label>
                                        <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} value={editForm.stok_tersedia} onChange={(e) => setEditForm({ ...editForm, stok_tersedia: e.target.value })} min="0" required /></div>
                                    <div><label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>Stok Minimum *</label>
                                        <input type="number" style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14, boxSizing: 'border-box' }} value={editForm.stok_minimum} onChange={(e) => setEditForm({ ...editForm, stok_minimum: e.target.value })} min="0" required /></div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                                    <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 600, cursor: 'pointer', backgroundColor: 'white', fontSize: 14 }}>Batal</button>
                                    <button type="submit" style={{ padding: '10px 24px', color: 'white', borderRadius: 8, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'linear-gradient(to right, #3b82f6, #2563eb)', fontSize: 14, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>Simpan Perubahan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* FOTO VIEWER MODAL */}
            {mounted && showFotoModal && viewFotoUrl && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={() => setShowFotoModal(false)} />
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <img src={viewFotoUrl} alt="Foto Dokumentasi" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 12, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }} />
                        <button onClick={() => setShowFotoModal(false)} style={{ position: 'absolute', top: -12, right: -12, width: 40, height: 40, borderRadius: '50%', backgroundColor: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                            <X size={20} color="#374151" />
                        </button>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT */}
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>
                {/* Breadcrumbs */}
                <nav style={{ display: 'flex', gap: 8, fontSize: 14, marginBottom: 24 }}>
                    <Link href="/dashboard" style={{ color: '#64748b', fontWeight: 500, textDecoration: 'none' }}>Home</Link>
                    <span style={{ color: '#cbd5e1' }}>/</span>
                    <Link href="/logistik" style={{ color: '#64748b', fontWeight: 500, textDecoration: 'none' }}>Logistik</Link>
                    <span style={{ color: '#cbd5e1' }}>/</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>Manajemen Stok</span>
                </nav>

                {/* Page Header */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, marginBottom: 32 }}>
                    <div>
                        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>📦 Manajemen Logistik PKMK</h1>
                        <p style={{ color: '#64748b', fontSize: 16, marginTop: 8, maxWidth: 600 }}>Kelola stok dan distribusi PKMK untuk balita stunting di wilayah kerja Puskesmas.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => openModal('masuk')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'linear-gradient(to right, #10b981, #059669)', color: 'white', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                            <ArrowDownCircle size={18} /> Stok Masuk
                        </button>
                        <button onClick={() => openModal('keluar')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', background: 'linear-gradient(to right, #ef4444, #dc2626)', color: 'white', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>
                            <ArrowUpCircle size={18} /> Stok Keluar
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }} className="stats-grid">
                    <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: -10, top: -10, width: 80, height: 80, borderRadius: '50%', background: '#eff6ff', opacity: 0.5 }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                            <span style={{ color: '#64748b', fontWeight: 500, fontSize: 14 }}>Total Stok</span>
                            <span style={{ width: 32, height: 32, borderRadius: 8, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Box size={18} color="#3b82f6" /></span>
                        </div>
                        <p style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', margin: '12px 0 0', position: 'relative' }}>{stats.total.toLocaleString()}</p>
                    </div>
                    <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: -10, top: -10, width: 80, height: 80, borderRadius: '50%', background: '#ecfdf5', opacity: 0.5 }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                            <span style={{ color: '#64748b', fontWeight: 500, fontSize: 14 }}>Stok Aman</span>
                            <span style={{ width: 32, height: 32, borderRadius: 8, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={18} color="#10b981" /></span>
                        </div>
                        <p style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', margin: '12px 0 0', position: 'relative' }}>{stats.aman} <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>Puskesmas</span></p>
                    </div>
                    <div style={{ background: 'white', borderRadius: 16, padding: 24, borderLeft: '4px solid #f59e0b', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748b', fontWeight: 500, fontSize: 14 }}>Stok Menipis</span>
                            <span style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={18} color="#f59e0b" /></span>
                        </div>
                        <p style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', margin: '12px 0 4px' }}>{stats.menipis} <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>Puskesmas</span></p>
                        <p style={{ fontSize: 12, color: '#f59e0b', fontWeight: 500, margin: 0 }}>Perlu Restock Segera</p>
                    </div>
                    <div style={{ background: 'white', borderRadius: 16, padding: 24, borderLeft: '4px solid #ef4444', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748b', fontWeight: 500, fontSize: 14 }}>Stok Habis</span>
                            <span style={{ width: 32, height: 32, borderRadius: 8, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={18} color="#ef4444" /></span>
                        </div>
                        <p style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', margin: '12px 0 4px' }}>{stats.habis} <span style={{ fontSize: 14, fontWeight: 400, color: '#64748b' }}>Puskesmas</span></p>
                        <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 500, margin: 0 }}>Tindakan Kritis Diperlukan</p>
                    </div>
                </div>

                {/* Charts Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 32 }} className="charts-grid">
                    <StokDistribusiChart data={distribusiData} total={stats.total} loading={loading} />
                    <StokStatusChart aman={stats.aman} menipis={stats.menipis} habis={stats.habis} loading={loading} />
                </div>

                {/* Filter Bar */}
                <div style={{ background: 'white', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
                        <Filter size={18} />
                        <span style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filters</span>
                    </div>
                    {user?.role === 'superadmin' && (
                        <select style={{ flex: 1, minWidth: 200, border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14 }} value={filterPuskesmas} onChange={(e) => setFilterPuskesmas(e.target.value)}>
                            <option value="">Semua Puskesmas</option>
                            {puskesmasList.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
                        </select>
                    )}
                    <select style={{ flex: 1, minWidth: 200, border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14 }} value={filterMerk} onChange={(e) => setFilterMerk(e.target.value)}>
                        <option value="">Semua Merk PKMK</option>
                        {jenisPkmkList.map(j => <option key={j.id} value={j.id}>{j.nama_merk}</option>)}
                    </select>
                    <button onClick={() => loadStok()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#f1f5f9', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: 14, color: '#475569' }}>
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>

                {/* Main Stock Table */}
                <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 32 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                            <thead>
                                <tr style={{ background: 'linear-gradient(to right, #10b981, #14b8a6)', color: 'white' }}>
                                    <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'left' }}>No</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'left' }}>Puskesmas</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'left' }}>Merk PKMK</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'center' }}>Kategori Usia</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'center' }}>Stok Tersedia</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'center' }}>Stok Minimum</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'center' }}>Status</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 700, textAlign: 'center' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStok.length === 0 ? (
                                    <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>Belum ada data stok. Klik "Stok Masuk" untuk menambahkan.</td></tr>
                                ) : (
                                    filteredStok.map((item, idx) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 1 ? '#fafafa' : 'white' }}>
                                            <td style={{ padding: '16px 24px', color: '#64748b' }}>{idx + 1}</td>
                                            <td style={{ padding: '16px 24px', fontWeight: 600, color: '#1e293b' }}>{item.puskesmas_nama}</td>
                                            <td style={{ padding: '16px 24px', color: '#475569' }}>{item.merk}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: item.kategori_usia === 'bayi' ? '#fce7f3' : '#e0f2fe', color: item.kategori_usia === 'bayi' ? '#be185d' : '#0369a1', border: `1px solid ${item.kategori_usia === 'bayi' ? '#fbcfe8' : '#bae6fd'}` }}>{item.rentang_usia}</span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center', fontWeight: 700, color: item.status === 'habis' ? '#dc2626' : item.status === 'menipis' ? '#d97706' : '#1e293b' }}>{item.stok_tersedia.toLocaleString()}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center', color: '#64748b' }}>{item.stok_minimum}</td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: item.status === 'aman' ? '#d1fae5' : item.status === 'menipis' ? '#fef3c7' : '#fee2e2', color: item.status === 'aman' ? '#065f46' : item.status === 'menipis' ? '#92400e' : '#991b1b', border: `1px solid ${item.status === 'aman' ? '#a7f3d0' : item.status === 'menipis' ? '#fde68a' : '#fecaca'}` }}>
                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.status === 'aman' ? '#10b981' : item.status === 'menipis' ? '#f59e0b' : '#ef4444' }} />
                                                    {item.status === 'aman' ? 'Aman' : item.status === 'menipis' ? 'Menipis' : 'Habis'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                                    <button onClick={() => openEdit(item)} title="Edit" style={{ padding: 6, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#3b82f6' }}><Pencil size={18} /></button>
                                                    <button onClick={() => handleDelete(item)} title="Hapus" style={{ padding: 6, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Transaction History */}
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <button onClick={toggleRiwayat} style={{ width: '100%', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: 'none', cursor: 'pointer', borderBottom: showRiwayat ? '1px solid #e2e8f0' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <History size={20} color="#64748b" />
                            <span style={{ fontWeight: 700, color: '#1e293b' }}>Riwayat Transaksi (50 Terbaru)</span>
                        </div>
                        <ChevronDown size={20} color="#64748b" style={{ transition: 'transform 0.2s', transform: showRiwayat ? 'rotate(180deg)' : 'rotate(0)' }} />
                    </button>
                    {showRiwayat && (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                                <thead><tr style={{ background: '#f1f5f9' }}>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Tanggal</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Merk</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Tipe</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Jumlah</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Keterangan</th>
                                    <th style={{ padding: '12px 24px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Bukti</th>
                                </tr></thead>
                                <tbody>
                                    {transaksiList.length === 0 ? (
                                        <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>Belum ada riwayat transaksi</td></tr>
                                    ) : (
                                        transaksiList.map((tx: any) => (
                                            <tr key={tx.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '12px 24px', color: '#475569' }}>{new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                                <td style={{ padding: '12px 24px', fontWeight: 600, color: '#1e293b' }}>{tx.merk}</td>
                                                <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                                                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: tx.tipe_transaksi?.startsWith('masuk') ? '#d1fae5' : '#fee2e2', color: tx.tipe_transaksi?.startsWith('masuk') ? '#047857' : '#dc2626' }}>
                                                        {tx.tipe_transaksi?.startsWith('masuk') ? 'Masuk' : 'Keluar'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 600, fontFamily: 'monospace', color: tx.jumlah > 0 ? '#047857' : '#dc2626' }}>{tx.jumlah > 0 ? '+' : ''}{tx.jumlah}</td>
                                                <td style={{ padding: '12px 24px', color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.keterangan || '-'}</td>
                                                <td style={{ padding: '12px 24px', textAlign: 'center' }}>
                                                    {tx.foto_url ? (
                                                        <button onClick={() => viewFoto(tx.foto_url)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 500 }}>
                                                            <Camera size={14} /> Lihat
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
                </div>
            </div>

            <style jsx>{`
                @media (max-width: 1024px) {
                    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
                    .charts-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    .stats-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </>
    );
}
