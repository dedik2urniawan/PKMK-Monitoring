"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/clientSession";
import { Eye, Pencil, Trash2, X, User, MapPin, Calendar, Weight, Ruler, AlertTriangle, Heart, TrendingUp } from "lucide-react";
import GrowthModal from "@/components/GrowthModal";

type Balita = {
    id: string;
    nik: string | null;
    nama_balita: string | null;
    jk: string | null;
    tgl_lahir: string | null;
    bb_lahir_kg: number | null;
    tb_lahir_cm: number | null;
    nama_ortu: string | null;
    kab_kota: string | null;
    kec: string | null;
    desa_kel: string | null;
    posyandu: string | null;
    rt: string | null;
    rw: string | null;
    alamat: string | null;
    puskesmas_id?: string | null;
    redflag_any: boolean | null;
    bb_tidak_adekuat: string | null;
    murmur_edema: string | null;
    delayed_development: string | null;
    wajah_dismorfik: string | null;
    organomegali_limfadenopati: string | null;
    ispa_cystitis: string | null;
    muntah_diare_berulang: string | null;
    diagnosa_penyakit_penyerta: string | null;
    keterangan_redflag: string | null;
};

interface BalitaActionsNewProps {
    balita: Balita;
    onDeleted?: () => void;
    onUpdated?: () => void;
}

export default function BalitaActionsNew({ balita, onDeleted, onUpdated }: BalitaActionsNewProps) {
    const [mounted, setMounted] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showGrowthModal, setShowGrowthModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Edit form state - ALL FIELDS
    const [editForm, setEditForm] = useState({
        nik: balita.nik || '',
        nama_balita: balita.nama_balita || '',
        jk: balita.jk || 'L',
        tgl_lahir: balita.tgl_lahir || '',
        bb_lahir_kg: balita.bb_lahir_kg?.toString() || '',
        tb_lahir_cm: balita.tb_lahir_cm?.toString() || '',
        nama_ortu: balita.nama_ortu || '',
        kab_kota: balita.kab_kota || 'MALANG',
        kec: balita.kec || '',
        puskesmas_id: balita.puskesmas_id || '',
        desa_kel: balita.desa_kel || '',
        posyandu: balita.posyandu || '',
        rt: balita.rt || '',
        rw: balita.rw || '',
        alamat: balita.alamat || '',
        bb_tidak_adekuat: balita.bb_tidak_adekuat || 'tidak',
        murmur_edema: balita.murmur_edema || 'tidak',
        delayed_development: balita.delayed_development || 'tidak',
        wajah_dismorfik: balita.wajah_dismorfik || 'tidak',
        organomegali_limfadenopati: balita.organomegali_limfadenopati || 'tidak',
        ispa_cystitis: balita.ispa_cystitis || 'tidak',
        muntah_diare_berulang: balita.muntah_diare_berulang || 'tidak',
        diagnosa_penyakit_penyerta: balita.diagnosa_penyakit_penyerta || '',
        keterangan_redflag: balita.keterangan_redflag || ''
    });

    // Region dropdown states
    const [kecList, setKecList] = useState<string[]>([]);
    const [pkmList, setPkmList] = useState<Array<{ id: string; nama: string }>>([]);
    const [desaList, setDesaList] = useState<Array<{ id: string; desa_kel: string }>>([]);
    const [puskesmasNama, setPuskesmasNama] = useState<string>('');

    useEffect(() => { setMounted(true); }, []);

    // Load region options when Edit Modal opens
    useEffect(() => {
        if (!showEditModal) return;
        (async () => {
            try {
                const authHeaders = await getAuthHeaders();
                // 1. Fetch Kecamatan list
                const kecRes = await fetch("/api/ref/kecamatan", { credentials: "include", headers: authHeaders });
                if (kecRes.ok) {
                    const kecData = await kecRes.json();
                    setKecList(kecData.items || []);
                }

                // 2. Fetch Puskesmas list
                const pkmRes = await fetch("/api/ref/puskesmas", { credentials: "include", headers: authHeaders });
                if (pkmRes.ok) {
                    const pkmData = await pkmRes.json();
                    const items = pkmData.items || [];
                    setPkmList(items);
                    const currentPkmId = editForm.puskesmas_id || balita.puskesmas_id;
                    if (currentPkmId) {
                        const foundPkm = items.find((p: any) => p.id === currentPkmId);
                        if (foundPkm) setPuskesmasNama(foundPkm.nama);
                    }
                }

                // 3. Fetch Desa list for current Puskesmas
                const pkmId = editForm.puskesmas_id || balita.puskesmas_id;
                if (pkmId) {
                    const desaRes = await fetch(`/api/ref/desa?puskesmas_id=${encodeURIComponent(pkmId)}`, { credentials: "include", headers: authHeaders });
                    if (desaRes.ok) {
                        const desaData = await desaRes.json();
                        setDesaList(desaData.items || []);
                    }
                } else {
                    const desaRes = await fetch("/api/ref/desa", { credentials: "include", headers: authHeaders });
                    if (desaRes.ok) {
                        const desaData = await desaRes.json();
                        setDesaList(desaData.items || []);
                    }
                }
            } catch (err) {
                console.error("Failed to load region refs for edit modal", err);
            }
        })();
    }, [showEditModal]);

    // Handle Kecamatan change
    const handleKecChange = async (newKec: string) => {
        setEditForm(f => ({ ...f, kec: newKec, desa_kel: '' }));
        if (!newKec) return;
        try {
            const authHeaders = await getAuthHeaders();
            const rp = await fetch(`/api/ref/puskesmas?kecamatan=${encodeURIComponent(newKec)}`, { credentials: "include", headers: authHeaders });
            if (rp.ok) {
                const p = await rp.json();
                const items = p.items || [];
                setPkmList(items);
                if (items.length === 1) {
                    const newPkmId = items[0].id;
                    setPuskesmasNama(items[0].nama);
                    setEditForm(f => ({ ...f, puskesmas_id: newPkmId }));
                    const rd = await fetch(`/api/ref/desa?puskesmas_id=${encodeURIComponent(newPkmId)}`, { credentials: "include", headers: authHeaders });
                    if (rd.ok) {
                        const d = await rd.json();
                        setDesaList(d.items || []);
                    }
                }
            }
        } catch (e) { console.error(e); }
    };

    // Handle Puskesmas change
    const handlePuskesmasChange = async (newPkmId: string) => {
        setEditForm(f => ({ ...f, puskesmas_id: newPkmId, desa_kel: '' }));
        const found = pkmList.find(p => p.id === newPkmId);
        if (found) setPuskesmasNama(found.nama);
        if (!newPkmId) return;
        try {
            const authHeaders = await getAuthHeaders();
            const rd = await fetch(`/api/ref/desa?puskesmas_id=${encodeURIComponent(newPkmId)}`, { credentials: "include", headers: authHeaders });
            if (rd.ok) {
                const d = await rd.json();
                setDesaList(d.items || []);
            }
        } catch (e) { console.error(e); }
    };

    function formatTanggal(s: string | null): string {
        if (!s) return "-";
        const d = new Date(s);
        return isNaN(d.getTime()) ? s : d.toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function calculateAge(tglLahir: string | null): string {
        if (!tglLahir) return "-";
        const birth = new Date(tglLahir);
        const now = new Date();
        const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (years > 0) return `${years} tahun ${remainingMonths} bulan`;
        return `${months} bulan`;
    }

    async function handleDelete() {
        setLoading(true);
        const authHeaders = await getAuthHeaders();
        const res = await fetch(`/api/balita/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            credentials: "include",
            body: JSON.stringify({ id: balita.id }),
        });
        setLoading(false);
        if (!res.ok) { toast.error(await res.text()); return; }
        toast.success("Hapus berhasil");
        setShowDeleteModal(false);
        onDeleted?.();
    }

    async function handleEdit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        const authHeaders = await getAuthHeaders();
        const payload = {
            id: balita.id,
            nik: editForm.nik || undefined,
            nama_balita: editForm.nama_balita,
            jk: editForm.jk,
            tgl_lahir: editForm.tgl_lahir,
            bb_lahir_kg: editForm.bb_lahir_kg === '' ? null : Number(editForm.bb_lahir_kg),
            tb_lahir_cm: editForm.tb_lahir_cm === '' ? null : Number(editForm.tb_lahir_cm),
            nama_ortu: editForm.nama_ortu,
            kab_kota: editForm.kab_kota,
            kec: editForm.kec,
            puskesmas_id: editForm.puskesmas_id,
            desa_kel: editForm.desa_kel,
            posyandu: editForm.posyandu,
            rt: editForm.rt,
            rw: editForm.rw,
            alamat: editForm.alamat,
            bb_tidak_adekuat: editForm.bb_tidak_adekuat,
            murmur_edema: editForm.murmur_edema,
            delayed_development: editForm.delayed_development,
            wajah_dismorfik: editForm.wajah_dismorfik,
            organomegali_limfadenopati: editForm.organomegali_limfadenopati,
            ispa_cystitis: editForm.ispa_cystitis,
            muntah_diare_berulang: editForm.muntah_diare_berulang,
            diagnosa_penyakit_penyerta: editForm.diagnosa_penyakit_penyerta,
            keterangan_redflag: editForm.keterangan_redflag
        };
        const res = await fetch(`/api/balita/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders },
            credentials: "include",
            body: JSON.stringify(payload),
        });
        setLoading(false);
        if (!res.ok) { toast.error("Gagal memperbarui data"); return; }
        toast.success("Data berhasil diperbarui");
        setShowEditModal(false);
        onUpdated?.();
    }

    const modalStyle = { position: 'fixed' as const, inset: 0, zIndex: 99999 };
    const backdropStyle = { position: 'absolute' as const, inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' };
    const modalContainerStyle = { position: 'absolute' as const, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '95%', maxWidth: '600px' };
    const modalBoxStyle = { backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' as const };
    const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', boxSizing: 'border-box' as const };
    const selectStyle = { ...inputStyle, backgroundColor: 'white' };
    const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '500' as const, color: '#374151', marginBottom: '4px' };

    return (
        <>
            {/* Action Buttons - Icon Only */}
            <div className="flex items-center justify-center gap-1">
                <button onClick={() => setShowViewModal(true)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Lihat Detail"><Eye size={16} /></button>
                <button onClick={() => setShowGrowthModal(true)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Lihat Pertumbuhan"><TrendingUp size={16} /></button>
                <button onClick={() => setShowEditModal(true)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Pencil size={16} /></button>
                <button onClick={() => setShowDeleteModal(true)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 size={16} /></button>
            </div>

            {/* GROWTH MODAL */}
            {mounted && showGrowthModal && (
                <GrowthModal balita={balita} onClose={() => setShowGrowthModal(false)} />
            )}

            {/* VIEW DETAIL MODAL */}
            {mounted && showViewModal && (
                <div style={modalStyle}>
                    <div style={backdropStyle} onClick={() => setShowViewModal(false)} />
                    <div style={{ ...modalContainerStyle, maxWidth: '480px' }}>
                        <div style={modalBoxStyle}>
                            <div style={{ padding: '16px 20px', backgroundColor: '#4f46e5', color: 'white', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><User size={20} /> Profil Balita</h2>
                                <button onClick={() => setShowViewModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 4px 0' }}>{balita.nama_balita || '-'}</h3>
                                    <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px 0' }}>NIK: {balita.nik || '-'}</p>
                                    {balita.redflag_any && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '9999px', fontSize: '12px', fontWeight: '600' }}>
                                            <AlertTriangle size={14} /> Terdeteksi Red Flag
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Calendar size={14} style={{ color: '#6b7280' }} /><span style={{ fontSize: '12px', color: '#6b7280' }}>Tanggal Lahir</span></div>
                                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{formatTanggal(balita.tgl_lahir)}</p>
                                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>Usia: {calculateAge(balita.tgl_lahir)}</p>
                                    </div>
                                    <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Heart size={14} style={{ color: '#6b7280' }} /><span style={{ fontSize: '12px', color: '#6b7280' }}>Jenis Kelamin</span></div>
                                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{balita.jk === 'L' ? 'Laki-laki' : balita.jk === 'P' ? 'Perempuan' : '-'}</p>
                                    </div>
                                    <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Weight size={14} style={{ color: '#6b7280' }} /><span style={{ fontSize: '12px', color: '#6b7280' }}>BB Lahir</span></div>
                                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{balita.bb_lahir_kg ? `${balita.bb_lahir_kg} kg` : '-'}</p>
                                    </div>
                                    <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}><Ruler size={14} style={{ color: '#6b7280' }} /><span style={{ fontSize: '12px', color: '#6b7280' }}>TB Lahir</span></div>
                                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{balita.tb_lahir_cm ? `${balita.tb_lahir_cm} cm` : '-'}</p>
                                    </div>
                                </div>
                                <div style={{ padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '8px', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}><MapPin size={14} style={{ color: '#059669' }} /><span style={{ fontSize: '12px', fontWeight: '600', color: '#059669' }}>Alamat</span></div>
                                    <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.5' }}>
                                        {balita.alamat || '-'}<br />Desa/Kel: {balita.desa_kel || '-'}, Kec: {balita.kec || '-'}<br />Posyandu: {balita.posyandu || '-'}
                                    </p>
                                </div>
                                <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>Nama Orang Tua</span>
                                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: '4px 0 0 0' }}>{balita.nama_ortu || '-'}</p>
                                </div>

                                {/* Detailed Red Flag Section */}
                                {balita.redflag_any && (
                                    <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                            <AlertTriangle size={18} style={{ color: '#dc2626' }} />
                                            <span style={{ fontSize: '14px', color: '#dc2626', fontWeight: '700' }}>Detail Red Flag</span>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                                <span style={{ fontSize: '12px', color: '#7f1d1d' }}>BB tidak adekuat</span>
                                                <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '9999px', backgroundColor: balita.bb_tidak_adekuat === 'ya' ? '#dc2626' : '#22c55e', color: 'white' }}>
                                                    {balita.bb_tidak_adekuat === 'ya' ? 'Ya' : 'Tidak'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                                <span style={{ fontSize: '12px', color: '#7f1d1d' }}>Murmur/Edema</span>
                                                <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '9999px', backgroundColor: balita.murmur_edema === 'ya' ? '#dc2626' : '#22c55e', color: 'white' }}>
                                                    {balita.murmur_edema === 'ya' ? 'Ya' : 'Tidak'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                                <span style={{ fontSize: '12px', color: '#7f1d1d' }}>Delayed Development</span>
                                                <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '9999px', backgroundColor: balita.delayed_development === 'ya' ? '#dc2626' : '#22c55e', color: 'white' }}>
                                                    {balita.delayed_development === 'ya' ? 'Ya' : 'Tidak'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                                <span style={{ fontSize: '12px', color: '#7f1d1d' }}>Wajah Dismorfik</span>
                                                <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '9999px', backgroundColor: balita.wajah_dismorfik === 'ya' ? '#dc2626' : '#22c55e', color: 'white' }}>
                                                    {balita.wajah_dismorfik === 'ya' ? 'Ya' : 'Tidak'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                                <span style={{ fontSize: '12px', color: '#7f1d1d' }}>Organomegali/LN</span>
                                                <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '9999px', backgroundColor: balita.organomegali_limfadenopati === 'ya' ? '#dc2626' : '#22c55e', color: 'white' }}>
                                                    {balita.organomegali_limfadenopati === 'ya' ? 'Ya' : 'Tidak'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                                <span style={{ fontSize: '12px', color: '#7f1d1d' }}>ISPA/Cystitis</span>
                                                <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '9999px', backgroundColor: balita.ispa_cystitis === 'ya' ? '#dc2626' : '#22c55e', color: 'white' }}>
                                                    {balita.ispa_cystitis === 'ya' ? 'Ya' : 'Tidak'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                                <span style={{ fontSize: '12px', color: '#7f1d1d' }}>Muntah/Diare</span>
                                                <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '9999px', backgroundColor: balita.muntah_diare_berulang === 'ya' ? '#dc2626' : '#22c55e', color: 'white' }}>
                                                    {balita.muntah_diare_berulang === 'ya' ? 'Ya' : 'Tidak'}
                                                </span>
                                            </div>
                                        </div>

                                        {balita.diagnosa_penyakit_penyerta && (
                                            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #fecaca', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>Diagnosa Penyakit Penyerta</span>
                                                <p style={{ fontSize: '13px', color: '#7f1d1d', margin: '4px 0 0 0' }}>{balita.diagnosa_penyakit_penyerta}</p>
                                            </div>
                                        )}

                                        {balita.keterangan_redflag && (
                                            <div style={{ padding: '10px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                                <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>Keterangan Red Flag</span>
                                                <p style={{ fontSize: '13px', color: '#7f1d1d', margin: '4px 0 0 0' }}>{balita.keterangan_redflag}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => setShowViewModal(false)} style={{ padding: '8px 20px', backgroundColor: '#4f46e5', color: 'white', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>Tutup</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL - ALL FIELDS */}
            {mounted && showEditModal && (
                <div style={modalStyle}>
                    <div style={backdropStyle} onClick={() => setShowEditModal(false)} />
                    <div style={modalContainerStyle}>
                        <div style={modalBoxStyle}>
                            <div style={{ padding: '16px 20px', backgroundColor: '#0ea5e9', color: 'white', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><Pencil size={20} /> Edit Data Balita</h2>
                                <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleEdit} style={{ padding: '20px' }}>
                                {/* Data Utama */}
                                <div style={{ marginBottom: '16px' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>📋 Data Utama</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div><label style={labelStyle}>NIK</label><input type="text" style={inputStyle} value={editForm.nik} onChange={(e) => setEditForm({ ...editForm, nik: e.target.value })} /></div>
                                        <div><label style={labelStyle}>Nama Balita *</label><input type="text" style={inputStyle} value={editForm.nama_balita} onChange={(e) => setEditForm({ ...editForm, nama_balita: e.target.value })} required /></div>
                                        <div><label style={labelStyle}>Jenis Kelamin *</label><select style={selectStyle} value={editForm.jk} onChange={(e) => setEditForm({ ...editForm, jk: e.target.value })}><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
                                        <div><label style={labelStyle}>Tanggal Lahir *</label><input type="date" style={inputStyle} value={editForm.tgl_lahir} onChange={(e) => setEditForm({ ...editForm, tgl_lahir: e.target.value })} required /></div>
                                        <div><label style={labelStyle}>BB Lahir (kg)</label><input type="number" step="0.01" style={inputStyle} value={editForm.bb_lahir_kg} onChange={(e) => setEditForm({ ...editForm, bb_lahir_kg: e.target.value })} /></div>
                                        <div><label style={labelStyle}>TB Lahir (cm)</label><input type="number" step="0.1" style={inputStyle} value={editForm.tb_lahir_cm} onChange={(e) => setEditForm({ ...editForm, tb_lahir_cm: e.target.value })} /></div>
                                    </div>
                                </div>

                                {/* Data Orang Tua & Alamat */}
                                <div style={{ marginBottom: '16px' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>👨‍👩‍👧 Orang Tua & Alamat</h4>
                                    
                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={labelStyle}>Nama Ibu/Ayah</label>
                                        <input type="text" style={inputStyle} placeholder="Nama lengkap orang tua" value={editForm.nama_ortu} onChange={(e) => setEditForm({ ...editForm, nama_ortu: e.target.value })} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Kabupaten / Kota</label>
                                            <input type="text" style={{ ...inputStyle, backgroundColor: '#f9fafb', color: '#6b7280' }} value={editForm.kab_kota} readOnly />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Kecamatan *</label>
                                            <select style={selectStyle} value={editForm.kec} onChange={(e) => handleKecChange(e.target.value)}>
                                                <option value="">-- Pilih Kecamatan --</option>
                                                {kecList.map((k) => (
                                                    <option key={k} value={k}>{k}</option>
                                                ))}
                                                {editForm.kec && !kecList.includes(editForm.kec) && (
                                                    <option value={editForm.kec}>{editForm.kec}</option>
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Puskesmas *</label>
                                            {pkmList.length > 0 ? (
                                                <select style={selectStyle} value={editForm.puskesmas_id} onChange={(e) => handlePuskesmasChange(e.target.value)}>
                                                    <option value="">-- Pilih Puskesmas --</option>
                                                    {pkmList.map((p) => (
                                                        <option key={p.id} value={p.id}>{p.nama}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input type="text" style={{ ...inputStyle, backgroundColor: '#f9fafb', color: '#6b7280' }} value={puskesmasNama || '-'} readOnly />
                                            )}
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Desa / Kelurahan *</label>
                                            <select style={selectStyle} value={editForm.desa_kel} onChange={(e) => setEditForm({ ...editForm, desa_kel: e.target.value })}>
                                                <option value="">-- Pilih Desa/Kel --</option>
                                                {desaList.map((d) => (
                                                    <option key={d.id} value={d.desa_kel}>{d.desa_kel}</option>
                                                ))}
                                                {editForm.desa_kel && !desaList.some(d => d.desa_kel === editForm.desa_kel) && (
                                                    <option value={editForm.desa_kel}>{editForm.desa_kel}</option>
                                                )}
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                        <div>
                                            <label style={labelStyle}>Posyandu</label>
                                            <input type="text" style={inputStyle} placeholder="Nama Posyandu" value={editForm.posyandu} onChange={(e) => setEditForm({ ...editForm, posyandu: e.target.value })} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>RT / RW</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input type="text" placeholder="RT" style={inputStyle} value={editForm.rt} onChange={(e) => setEditForm({ ...editForm, rt: e.target.value })} />
                                                <input type="text" placeholder="RW" style={inputStyle} value={editForm.rw} onChange={(e) => setEditForm({ ...editForm, rw: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={labelStyle}>Alamat Lengkap</label>
                                        <input type="text" style={inputStyle} placeholder="Jalan, No. Rumah" value={editForm.alamat} onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })} />
                                    </div>
                                </div>

                                {/* Red Flag Section */}
                                <div style={{ marginBottom: '16px' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626', margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '1px solid #fecaca' }}>🚨 Red Flag</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div><label style={labelStyle}>BB tidak adekuat</label><select style={selectStyle} value={editForm.bb_tidak_adekuat} onChange={(e) => setEditForm({ ...editForm, bb_tidak_adekuat: e.target.value })}><option value="tidak">Tidak</option><option value="ya">Ya</option></select></div>
                                        <div><label style={labelStyle}>Murmur/Edema</label><select style={selectStyle} value={editForm.murmur_edema} onChange={(e) => setEditForm({ ...editForm, murmur_edema: e.target.value })}><option value="tidak">Tidak</option><option value="ya">Ya</option></select></div>
                                        <div><label style={labelStyle}>Delayed Development</label><select style={selectStyle} value={editForm.delayed_development} onChange={(e) => setEditForm({ ...editForm, delayed_development: e.target.value })}><option value="tidak">Tidak</option><option value="ya">Ya</option></select></div>
                                        <div><label style={labelStyle}>Wajah Dismorfik</label><select style={selectStyle} value={editForm.wajah_dismorfik} onChange={(e) => setEditForm({ ...editForm, wajah_dismorfik: e.target.value })}><option value="tidak">Tidak</option><option value="ya">Ya</option></select></div>
                                        <div><label style={labelStyle}>Organomegali/Limfadenopati</label><select style={selectStyle} value={editForm.organomegali_limfadenopati} onChange={(e) => setEditForm({ ...editForm, organomegali_limfadenopati: e.target.value })}><option value="tidak">Tidak</option><option value="ya">Ya</option></select></div>
                                        <div><label style={labelStyle}>ISPA/Cystitis berulang</label><select style={selectStyle} value={editForm.ispa_cystitis} onChange={(e) => setEditForm({ ...editForm, ispa_cystitis: e.target.value })}><option value="tidak">Tidak</option><option value="ya">Ya</option></select></div>
                                        <div><label style={labelStyle}>Muntah/Diare berulang</label><select style={selectStyle} value={editForm.muntah_diare_berulang} onChange={(e) => setEditForm({ ...editForm, muntah_diare_berulang: e.target.value })}><option value="tidak">Tidak</option><option value="ya">Ya</option></select></div>
                                        <div><label style={labelStyle}>Diagnosa Penyakit Penyerta</label><input type="text" style={inputStyle} value={editForm.diagnosa_penyakit_penyerta} onChange={(e) => setEditForm({ ...editForm, diagnosa_penyakit_penyerta: e.target.value })} /></div>
                                        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Keterangan Red Flag</label><input type="text" style={inputStyle} value={editForm.keterangan_redflag} onChange={(e) => setEditForm({ ...editForm, keterangan_redflag: e.target.value })} /></div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                                    <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', backgroundColor: 'white' }}>Batal</button>
                                    <button type="submit" disabled={loading} style={{ padding: '10px 24px', backgroundColor: '#0ea5e9', color: 'white', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {mounted && showDeleteModal && (
                <div style={modalStyle}>
                    <div style={backdropStyle} onClick={() => setShowDeleteModal(false)} />
                    <div style={{ ...modalContainerStyle, maxWidth: '400px' }}>
                        <div style={modalBoxStyle}>
                            <div style={{ padding: '16px 20px', backgroundColor: '#dc2626', color: 'white', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><Trash2 size={20} /> Konfirmasi Hapus</h2>
                                <button onClick={() => setShowDeleteModal(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <p style={{ fontSize: '14px', color: '#374151', margin: '0 0 8px 0' }}>Apakah Anda yakin ingin menghapus data balita:</p>
                                <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderRadius: '8px', marginBottom: '16px' }}>
                                    <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: 0 }}>{balita.nama_balita || '-'}</p>
                                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>NIK: {balita.nik || '-'}</p>
                                </div>
                                <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>⚠️ Tindakan ini tidak dapat dibatalkan!</p>
                            </div>
                            <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button onClick={() => setShowDeleteModal(false)} style={{ padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', backgroundColor: 'white' }}>Batal</button>
                                <button onClick={handleDelete} disabled={loading} style={{ padding: '10px 24px', backgroundColor: '#dc2626', color: 'white', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
                                    {loading ? 'Menghapus...' : 'Ya, Hapus'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
