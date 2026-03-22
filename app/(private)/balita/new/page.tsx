"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import Link from "next/link";
import { User, Home, AlertTriangle, Save, ArrowLeft, Info } from "lucide-react";

type FormVals = {
  nik?: string;
  nama_balita: string;
  jk: "L" | "P";
  tgl_lahir: string;
  nama_ortu?: string;
  kab_kota?: string;
  kec?: string;
  desa_kel?: string;
  posyandu?: string;
  rt?: string;
  rw?: string;
  alamat?: string;
  bb_lahir_kg?: number | "";
  tb_lahir_cm?: number | "";
  puskesmas_id?: string;
  bb_tidak_adekuat?: string;
  murmur_edema?: string;
  delayed_development?: string;
  wajah_dismorfik?: string;
  organomegali_limfadenopati?: string;
  ispa_cystitis?: string;
  muntah_diare_berulang?: string;
  diagnosa_penyakit_penyerta?: string;
  keterangan_redflag?: string;
};

export default function NewBalitaPage() {
  const [values, setValues] = useState<FormVals>({
    nama_balita: "",
    jk: "L",
    tgl_lahir: "",
    nik: "",
    nama_ortu: "",
    kab_kota: "MALANG",
    kec: "",
    desa_kel: "",
    posyandu: "",
    rt: "",
    rw: "",
    alamat: "",
    bb_lahir_kg: "",
    tb_lahir_cm: "",
    bb_tidak_adekuat: "tidak",
    murmur_edema: "tidak",
    delayed_development: "tidak",
    wajah_dismorfik: "tidak",
    organomegali_limfadenopati: "tidak",
    ispa_cystitis: "tidak",
    muntah_diare_berulang: "tidak",
    diagnosa_penyakit_penyerta: "",
    keterangan_redflag: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [kecList, setKecList] = useState<string[]>([]);
  const [pkmList, setPkmList] = useState<Array<{ id: string; nama: string }>>([]);
  const [desaList, setDesaList] = useState<Array<{ id: string; desa_kel: string }>>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  function set<K extends keyof FormVals>(key: K, val: FormVals[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  // Load kecamatan
  useEffect(() => {
    (async () => {
      try {
        await ensureServerSession();
        const authHeaders = await getAuthHeaders();
        const res = await fetch("/api/ref/kecamatan", { credentials: "include", headers: authHeaders });
        const data = await res.json();
        setKecList(data.items || []);
      } catch (e: any) {
        setLoadErr("Gagal memuat referensi kecamatan");
      }
    })();
  }, []);

  // Prefill puskesmas_id dari metadata user
  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getUser();
        const meta: any = data.user?.user_metadata || {};
        if (meta.puskesmas_id && !values.puskesmas_id) {
          set("puskesmas_id", meta.puskesmas_id);
        }
        if (meta.kec && !values.kec) {
          set("kec", meta.kec);
        }
      } catch { }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload puskesmas when kec changes
  useEffect(() => {
    if (!values.kec) return;
    (async () => {
      try {
        await ensureServerSession();
        const authHeaders = await getAuthHeaders();
        const rp = await fetch(`/api/ref/puskesmas?kecamatan=${encodeURIComponent(values.kec || '')}`, { credentials: "include", headers: authHeaders });
        const p = await rp.json();
        setPkmList((p.items || []).map((r: any) => ({ id: r.id, nama: r.nama })));
        setDesaList([]);
        set("desa_kel", "");
      } catch (e: any) {
        setLoadErr("Gagal memuat Puskesmas/Desa");
      }
    })();
  }, [values.kec]);

  // Reload desa when puskesmas changes
  useEffect(() => {
    if (!values.puskesmas_id) return;
    (async () => {
      try {
        await ensureServerSession();
        const authHeaders = await getAuthHeaders();
        const rd = await fetch(`/api/ref/desa?puskesmas_id=${encodeURIComponent(values.puskesmas_id || '')}`, { credentials: "include", headers: authHeaders });
        const d = await rd.json();
        setDesaList((d.items || []).map((r: any) => ({ id: r.id, desa_kel: r.desa_kel })));
      } catch (e: any) {
        setLoadErr("Gagal memuat daftar desa");
      }
    })();
  }, [values.puskesmas_id]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const payload = {
      ...values,
      bb_lahir_kg: values.bb_lahir_kg === "" ? undefined : Number(values.bb_lahir_kg),
      tb_lahir_cm: values.tb_lahir_cm === "" ? undefined : Number(values.tb_lahir_cm),
      puskesmas_id: !values.puskesmas_id ? undefined : values.puskesmas_id,
    };
    await ensureServerSession();
    const authHeaders = await getAuthHeaders();
    const res = await fetch("/api/balita", {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json", ...authHeaders },
    });
    setSaving(false);
    if (!res.ok) {
      const t = await res.text();
      setMsg({ type: 'error', text: `Gagal: ${t}` });
      return;
    }
    setMsg({ type: 'success', text: "Berhasil menambahkan balita." });
    setValues({
      nama_balita: "",
      jk: "L",
      tgl_lahir: "",
      nik: "",
      nama_ortu: "",
      kab_kota: "MALANG",
      kec: "",
      desa_kel: "",
      posyandu: "",
      rt: "",
      rw: "",
      alamat: "",
      bb_lahir_kg: "",
      tb_lahir_cm: "",
      bb_tidak_adekuat: "tidak",
      murmur_edema: "tidak",
      delayed_development: "tidak",
      wajah_dismorfik: "tidak",
      organomegali_limfadenopati: "tidak",
      ispa_cystitis: "tidak",
      muntah_diare_berulang: "tidak",
      diagnosa_penyakit_penyerta: "",
      keterangan_redflag: "",
    });
  }

  function handleReset() {
    setValues({
      nama_balita: "",
      jk: "L",
      tgl_lahir: "",
      nik: "",
      nama_ortu: "",
      kab_kota: "MALANG",
      kec: "",
      desa_kel: "",
      posyandu: "",
      rt: "",
      rw: "",
      alamat: "",
      bb_lahir_kg: "",
      tb_lahir_cm: "",
      bb_tidak_adekuat: "tidak",
      murmur_edema: "tidak",
      delayed_development: "tidak",
      wajah_dismorfik: "tidak",
      organomegali_limfadenopati: "tidak",
      ispa_cystitis: "tidak",
      muntah_diare_berulang: "tidak",
      diagnosa_penyakit_penyerta: "",
      keterangan_redflag: "",
    });
    setMsg(null);
  }

  return (
    <>
      <style jsx>{`
        .page-container {
          max-width: 1024px;
          margin: 0 auto;
          padding: 16px;
          padding-bottom: 100px; /* Safe space for BottomNav */
        }
        @media (min-width: 640px) {
          .page-container {
            padding: 32px;
          }
        }
        .page-header {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }
        @media (min-width: 640px) {
          .page-header {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }
        .page-title {
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.025em;
        }
        .page-subtitle {
          color: #64748b;
          font-size: 15px;
          margin-top: 4px;
        }
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .back-btn:hover {
          background: #f8fafc;
          color: #0f172a;
        }
        .alert {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          border-left: 4px solid;
        }
        .alert.info {
          background: #eff6ff;
          border-color: #3b82f6;
        }
        .alert.success {
          background: #f0fdf4;
          border-color: #22c55e;
        }
        .alert.error {
          background: #fef2f2;
          border-color: #ef4444;
        }
        .alert-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }
        .alert.info .alert-icon { color: #3b82f6; }
        .alert.success .alert-icon { color: #22c55e; }
        .alert.error .alert-icon { color: #ef4444; }
        .alert-title {
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 2px;
        }
        .alert.info .alert-title { color: #1e40af; }
        .alert.success .alert-title { color: #166534; }
        .alert.error .alert-title { color: #991b1b; }
        .alert-text {
          font-size: 14px;
        }
        .alert.info .alert-text { color: #1e40af; }
        .alert.success .alert-text { color: #166534; }
        .alert.error .alert-text { color: #991b1b; }
        .form-section {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .form-section.redflag {
          background: #fef2f2;
          border-color: #fecaca;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 24px;
          border-bottom: 1px solid #f1f5f9;
          background: #f8fafc;
        }
        .form-section.redflag .section-header {
          background: #fee2e2;
          border-color: #fecaca;
        }
        .section-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .section-icon.teal {
          background: rgba(20, 184, 166, 0.1);
          color: #14b8a6;
        }
        .section-icon.blue {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        .section-icon.red {
          background: #fecaca;
          color: #dc2626;
        }
        .section-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }
        .form-section.redflag .section-title {
          color: #991b1b;
        }
        .section-body {
          padding: 16px;
        }
        @media (min-width: 640px) {
          .section-body {
            padding: 24px;
          }
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .form-grid-3 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .form-grid-3 {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .form-grid-3 {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-group.full {
          grid-column: 1 / -1;
        }
        .form-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
        }
        .form-section.redflag .form-label {
          color: #7f1d1d;
        }
        .required {
          color: #ef4444;
        }
        .form-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          color: #0f172a;
          background: white;
          transition: all 0.2s;
        }
        .form-input:focus {
          outline: none;
          border-color: #14b8a6;
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
        }
        .form-input.readonly {
          background: #f8fafc;
          color: #64748b;
          cursor: not-allowed;
        }
        .form-section.redflag .form-input:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        .input-suffix {
          position: relative;
        }
        .input-suffix .suffix {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 14px;
          color: #94a3b8;
          font-weight: 500;
        }
        .input-suffix .form-input {
          padding-right: 48px;
        }
        .rt-rw-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .form-footer {
          display: flex;
          flex-direction: column-reverse;
          gap: 16px;
          padding: 16px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          border-radius: 0 0 12px 12px;
        }
        @media (min-width: 640px) {
          .form-footer {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 24px;
          }
        }
        .required-note {
          font-size: 14px;
          color: #64748b;
          text-align: center;
        }
        @media (min-width: 640px) {
          .required-note {
            text-align: left;
          }
        }
        .btn-group {
          display: flex;
          gap: 12px;
          width: 100%;
        }
        @media (min-width: 640px) {
          .btn-group {
            width: auto;
          }
        }
        .btn-reset {
          flex: 1;
          padding: 12px 20px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-reset:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .btn-submit {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          background: #14b8a6;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(20, 184, 166, 0.3);
        }
        .btn-submit:hover:not(:disabled) {
          background: #0d9488;
        }
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Tambah Balita Baru</h1>
            <p className="page-subtitle">Lengkapi formulir untuk mendaftarkan balita ke program PKMK</p>
          </div>
          <Link href="/balita" className="back-btn">
            <ArrowLeft size={18} />
            Kembali ke Data Balita
          </Link>
        </div>

        {/* Info Alert */}
        <div className="alert info">
          <Info size={20} className="alert-icon" />
          <div>
            <p className="alert-title">Informasi Pengisian</p>
            <p className="alert-text">Pastikan data NIK yang dimasukkan sudah benar dan terdaftar di Dukcapil. Data Red Flag sangat penting untuk penentuan intervensi medis.</p>
          </div>
        </div>

        {/* Success/Error Message */}
        {msg && (
          <div className={`alert ${msg.type}`}>
            {msg.type === 'success' ? <Save size={20} className="alert-icon" /> : <AlertTriangle size={20} className="alert-icon" />}
            <div>
              <p className="alert-title">{msg.type === 'success' ? 'Berhasil!' : 'Terjadi Kesalahan'}</p>
              <p className="alert-text">{msg.text}</p>
            </div>
          </div>
        )}

        {/* Load Error */}
        {loadErr && (
          <div className="alert error">
            <AlertTriangle size={20} className="alert-icon" />
            <div>
              <p className="alert-title">Error</p>
              <p className="alert-text">{loadErr}</p>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit}>
          {/* Section 1: Data Identitas Balita */}
          <section className="form-section">
            <div className="section-header">
              <div className="section-icon teal">
                <User size={18} />
              </div>
              <h3 className="section-title">Data Identitas Balita</h3>
            </div>
            <div className="section-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">NIK (16 Digit) <span className="required">*</span></label>
                  <input
                    className="form-input"
                    value={values.nik ?? ""}
                    onChange={(e) => set("nik", e.target.value.replace(/\D/g, "").slice(0, 16))}
                    placeholder="Masukkan 16 digit NIK"
                    pattern="[0-9]{16}"
                    minLength={16}
                    maxLength={16}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Lengkap Balita <span className="required">*</span></label>
                  <input
                    className="form-input"
                    value={values.nama_balita}
                    onChange={(e) => set("nama_balita", e.target.value)}
                    placeholder="Nama lengkap sesuai akta"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Jenis Kelamin <span className="required">*</span></label>
                  <select
                    className="form-input"
                    value={values.jk}
                    onChange={(e) => set("jk", e.target.value as "L" | "P")}
                    required
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Lahir <span className="required">*</span></label>
                  <input
                    type="date"
                    className="form-input"
                    value={values.tgl_lahir}
                    onChange={(e) => set("tgl_lahir", e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Berat Badan Lahir</label>
                  <div className="input-suffix">
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={values.bb_lahir_kg ?? ""}
                      onChange={(e) => set("bb_lahir_kg", e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0.00"
                    />
                    <span className="suffix">kg</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Tinggi Badan Lahir</label>
                  <div className="input-suffix">
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      value={values.tb_lahir_cm ?? ""}
                      onChange={(e) => set("tb_lahir_cm", e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0.0"
                    />
                    <span className="suffix">cm</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Data Orang Tua & Alamat */}
          <section className="form-section">
            <div className="section-header">
              <div className="section-icon blue">
                <Home size={18} />
              </div>
              <h3 className="section-title">Data Orang Tua & Alamat</h3>
            </div>
            <div className="section-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">Nama Ibu/Ayah</label>
                  <input
                    className="form-input"
                    value={values.nama_ortu ?? ""}
                    onChange={(e) => set("nama_ortu", e.target.value)}
                    placeholder="Nama lengkap orang tua"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kabupaten/Kota</label>
                  <input
                    className="form-input readonly"
                    value={values.kab_kota ?? "MALANG"}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Kecamatan <span className="required">*</span></label>
                  <select
                    className="form-input"
                    value={values.kec ?? ""}
                    onChange={(e) => set("kec", e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Kecamatan --</option>
                    {kecList.map((k) => (<option key={k} value={k}>{k}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Puskesmas <span className="required">*</span></label>
                  <select
                    className="form-input"
                    value={values.puskesmas_id ?? ""}
                    onChange={(e) => set("puskesmas_id", e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Puskesmas --</option>
                    {pkmList.length === 0 && <option value="" disabled>(Belum ada data)</option>}
                    {pkmList.map((p) => (<option key={p.id} value={p.id}>{p.nama}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Desa/Kelurahan <span className="required">*</span></label>
                  <select
                    className="form-input"
                    value={values.desa_kel ?? ""}
                    onChange={(e) => set("desa_kel", e.target.value)}
                    required
                  >
                    <option value="">-- Pilih Desa/Kel --</option>
                    {desaList.length === 0 && <option value="" disabled>(Belum ada data)</option>}
                    {desaList.map((d) => (<option key={d.id} value={d.desa_kel}>{d.desa_kel}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Posyandu</label>
                  <input
                    className="form-input"
                    value={values.posyandu ?? ""}
                    onChange={(e) => set("posyandu", e.target.value)}
                    placeholder="Nama Posyandu"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">RT / RW</label>
                  <div className="rt-rw-grid">
                    <input
                      className="form-input"
                      value={values.rt ?? ""}
                      onChange={(e) => set("rt", e.target.value)}
                      placeholder="RT"
                    />
                    <input
                      className="form-input"
                      value={values.rw ?? ""}
                      onChange={(e) => set("rw", e.target.value)}
                      placeholder="RW"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Alamat Lengkap</label>
                  <input
                    className="form-input"
                    value={values.alamat ?? ""}
                    onChange={(e) => set("alamat", e.target.value)}
                    placeholder="Jalan, No. Rumah"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Asesmen Red Flag */}
          <section className="form-section redflag">
            <div className="section-header">
              <div className="section-icon red">
                <AlertTriangle size={18} />
              </div>
              <h3 className="section-title">Asesmen Red Flag</h3>
            </div>
            <div className="section-body">
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">BB Tidak Adekuat?</label>
                  <select className="form-input" value={values.bb_tidak_adekuat ?? "tidak"} onChange={(e) => set("bb_tidak_adekuat", e.target.value)}>
                    <option value="tidak">Tidak</option>
                    <option value="ya">Ya</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Murmur / Edema?</label>
                  <select className="form-input" value={values.murmur_edema ?? "tidak"} onChange={(e) => set("murmur_edema", e.target.value)}>
                    <option value="tidak">Tidak</option>
                    <option value="ya">Ya</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Delayed Development?</label>
                  <select className="form-input" value={values.delayed_development ?? "tidak"} onChange={(e) => set("delayed_development", e.target.value)}>
                    <option value="tidak">Tidak</option>
                    <option value="ya">Ya</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Wajah Dismorfik?</label>
                  <select className="form-input" value={values.wajah_dismorfik ?? "tidak"} onChange={(e) => set("wajah_dismorfik", e.target.value)}>
                    <option value="tidak">Tidak</option>
                    <option value="ya">Ya</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Organomegali / LN?</label>
                  <select className="form-input" value={values.organomegali_limfadenopati ?? "tidak"} onChange={(e) => set("organomegali_limfadenopati", e.target.value)}>
                    <option value="tidak">Tidak</option>
                    <option value="ya">Ya</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">ISPA / Cystitis Berulang?</label>
                  <select className="form-input" value={values.ispa_cystitis ?? "tidak"} onChange={(e) => set("ispa_cystitis", e.target.value)}>
                    <option value="tidak">Tidak</option>
                    <option value="ya">Ya</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Muntah / Diare Berulang?</label>
                  <select className="form-input" value={values.muntah_diare_berulang ?? "tidak"} onChange={(e) => set("muntah_diare_berulang", e.target.value)}>
                    <option value="tidak">Tidak</option>
                    <option value="ya">Ya</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Diagnosa Penyakit Penyerta</label>
                  <input
                    className="form-input"
                    value={values.diagnosa_penyakit_penyerta ?? ""}
                    onChange={(e) => set("diagnosa_penyakit_penyerta", e.target.value)}
                    placeholder="Jika ada..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Keterangan Tambahan</label>
                  <input
                    className="form-input"
                    value={values.keterangan_redflag ?? ""}
                    onChange={(e) => set("keterangan_redflag", e.target.value)}
                    placeholder="Catatan medis tambahan"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Form Footer */}
          <div className="form-footer">
            <p className="required-note"><span className="required">*</span> Kolom wajib diisi</p>
            <div className="btn-group">
              <button type="button" className="btn-reset" onClick={handleReset}>Reset Form</button>
              <button type="submit" className="btn-submit" disabled={saving}>
                <Save size={18} />
                {saving ? "Menyimpan..." : "Simpan Data"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
