"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/clientSession";

type Kohort = { id: string; periode_mulai?: string } | null;
type Balita = { id: string; nama_balita: string; jk?: 'L' | 'P' } | null;
type JenisPkmk = { id: string; nama_merk: string; kategori_usia: string; rentang_usia: string; satuan: string; };

export default function NewPemberian() {
  const params = useParams<{ balitaId: string }>();
  const [kohort, setKohort] = useState<Kohort>(null);
  const [balita, setBalita] = useState<Balita>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [form, setForm] = useState({ minggu_ke: 1, tanggal: "", jumlah_unit: "", jenis_formulasi: "", keterangan: "" });
  const [jenisPkmkList, setJenisPkmkList] = useState<JenisPkmk[]>([]);

  // Fetch jenisPkmkList from API (same as logistik menu)
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/ref/jenis-pkmk");
      const data = await res.json();
      setJenisPkmkList(data.items || []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/kohort/by-balita?balita_id=${params.balitaId}`);
      const d = await r.json();
      setKohort(d.item ?? null);
    })();
  }, [params.balitaId]);

  useEffect(() => {
    (async () => {
      const rb = await fetch(`/api/monitoring/balita?balita_id=${params.balitaId}`);
      const db = await rb.json();
      const it = (db.items?.[0]);
      setBalita(it ? { id: it.id, nama_balita: it.nama_balita, jk: it.jk } : null);
    })();
  }, [params.balitaId]);

  useEffect(() => {
    if (!kohort) return;
    (async () => {
      const rh = await fetch(`/api/monitoring/pemberian?kohort_id=${kohort.id}`);
      const dh = await rh.json();
      const items = dh.items || [];
      setHistory(items);
      if (items.length > 0 && !editingId) {
        const maxMinggu = Math.max(...items.map((h: any) => h.minggu_ke || 0));
        const nextMinggu = Math.min(12, maxMinggu + 1);
        setForm((f) => ({ ...f, minggu_ke: nextMinggu }));
      }
    })();
  }, [kohort, editingId]);

  const today = new Date().toISOString().split('T')[0];

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!(form.minggu_ke >= 1 && form.minggu_ke <= 12)) e.minggu_ke = "Minggu ke harus 1–12";
    if (!form.tanggal) e.tanggal = "Wajib diisi";
    else if (form.tanggal > today) e.tanggal = "Tanggal tidak boleh melebihi hari ini";
    if (!form.jumlah_unit || Number(form.jumlah_unit) <= 0) e.jumlah_unit = "Jumlah harus > 0";
    if (!form.jenis_formulasi) e.jenis_formulasi = "Wajib diisi";
    return e;
  }, [form, today]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!kohort) { setMsg("Balita belum memiliki kohort."); toast.error("Kohort belum ada"); return; }
    setSaving(true); setMsg(null);
    const payload = {
      kohort_id: kohort.id,
      minggu_ke: Number(form.minggu_ke),
      tanggal: form.tanggal,
      jumlah_unit: Number(form.jumlah_unit),
      jenis_formulasi: form.jenis_formulasi,
      keterangan: form.keterangan || undefined,
    };
    const authHeaders = await getAuthHeaders();
    const res = await fetch("/api/monitoring/pemberian", { method: editingId ? "PATCH" : "POST", credentials: "include", headers: { "Content-Type": "application/json", ...authHeaders }, body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload) });
    setSaving(false);
    if (!res.ok) { const t = await res.text(); setMsg(t); toast.error(t); return; }
    toast.success(editingId ? "Perubahan disimpan" : "Tersimpan");
    try {
      const rh = await fetch(`/api/monitoring/pemberian?kohort_id=${kohort.id}`);
      const dh = await rh.json();
      setHistory(dh.items || []);
      setEditingId(null);
      setForm({ minggu_ke: 1, tanggal: "", jumlah_unit: "", jenis_formulasi: "", keterangan: "" });
    } catch { }
  }

  return (
    <div className="max-w-4xl">
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#607a8a', marginBottom: 8 }}>
        <span>Anak</span>
        <span style={{ fontSize: 12 }}>›</span>
        <span>Detail</span>
        <span style={{ fontSize: 12 }}>›</span>
        <span style={{ color: '#3b82f6', fontWeight: 500 }}>Monitoring Pemberian</span>
      </div>

      {/* Page Title */}
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111518', marginBottom: 8 }}>Tambah Monitoring: Pemberian</h1>

      {/* Child Info Bar */}
      {(balita || kohort) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {balita?.jk && (
            <span style={{
              background: balita.jk === 'L' ? '#dbeafe' : '#fce7f3',
              color: balita.jk === 'L' ? '#1d4ed8' : '#be185d',
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4
            }}>
              {balita.jk === 'L' ? 'Laki-laki' : 'Perempuan'}
            </span>
          )}
          <span style={{ fontSize: 14, color: '#607a8a' }}>
            Anak: <strong style={{ color: '#111518' }}>{balita?.nama_balita || '-'}</strong>
          </span>
          <span style={{ color: '#d1d5db' }}>|</span>
          <span style={{ fontSize: 14, color: '#607a8a' }}>
            {kohort ? `Awal Kohort: ${new Date(kohort.periode_mulai as any).toLocaleDateString('id-ID')}` : 'Kohort belum dimulai'}
          </span>
        </div>
      )}

      {/* Alert Message */}
      {msg && (
        <div style={{ background: '#dbeafe', border: '1px solid #93c5fd', color: '#1e40af', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
          {msg}
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={onSubmit} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

        {/* Section 1: Data Pengukuran Dasar */}
        <div style={{ padding: '28px 32px', borderBottom: '1px solid #f0f3f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, background: '#eff6ff', color: '#3b82f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111518' }}>Data Pemberian</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28 }} className="form-grid-responsive">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111518' }}>Minggu Ke <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="number" min={1} max={12} value={form.minggu_ke} onChange={(e) => setForm({ ...form, minggu_ke: Number(e.target.value) })} className="input" required />
              {errors.minggu_ke && <p style={{ fontSize: 12, color: '#dc2626' }}>{errors.minggu_ke}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111518' }}>Tanggal Pemberian <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" value={form.tanggal} max={today} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="input" required />
              {errors.tanggal && <p style={{ fontSize: 12, color: '#dc2626' }}>{errors.tanggal}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Detail Pemberian */}
        <div style={{ padding: '28px 32px', borderBottom: '1px solid #f0f3f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, background: '#ecfdf5', color: '#10b981', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🥛</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111518' }}>Detail Formulasi</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 280 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111518' }}>Jumlah Unit <span style={{ color: '#ef4444' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input type="number" value={form.jumlah_unit} onChange={(e) => setForm({ ...form, jumlah_unit: e.target.value })} className="input" required placeholder="0" style={{ paddingRight: 50 }} />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#607a8a' }}>ml</span>
              </div>
              {errors.jumlah_unit && <p style={{ fontSize: 12, color: '#dc2626' }}>{errors.jumlah_unit}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111518' }}>Jenis Formulasi / Merk PKMK <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={form.jenis_formulasi} onChange={(e) => setForm({ ...form, jenis_formulasi: e.target.value })} className="input" required style={{ maxWidth: 500 }}>
                <option value="">- Pilih Formulasi -</option>
                {jenisPkmkList.map(j => (
                  <option key={j.id} value={j.nama_merk}>{j.nama_merk} ({j.rentang_usia})</option>
                ))}
              </select>
              {errors.jenis_formulasi && <p style={{ fontSize: 12, color: '#dc2626' }}>{errors.jenis_formulasi}</p>}
            </div>
          </div>
        </div>

        {/* Section 3: Keterangan */}
        <div style={{ padding: '28px 32px', borderBottom: '1px solid #f0f3f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, background: '#f3f4f6', color: '#6b7280', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📝</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111518' }}>Keterangan Tambahan</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#6b7280' }}>Catatan (Opsional)</label>
            <textarea
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              className="input"
              placeholder="Tambahkan catatan jika diperlukan..."
              style={{ minHeight: 80, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Form Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: '#f9fafb' }}>
          <p style={{ fontSize: 14, color: '#6b7280', fontStyle: 'italic' }}>* Kolom wajib diisi</p>
          <div style={{ display: 'flex', gap: 12 }}>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ minggu_ke: 1, tanggal: "", jumlah_unit: "", jenis_formulasi: "", keterangan: "" }); }}
                style={{ padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 500, background: 'white', color: '#374151', border: '1px solid #d1d5db', cursor: 'pointer' }}>
                Batal
              </button>
            )}
            <button type="submit" disabled={saving || Object.keys(errors).length > 0}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, background: saving || Object.keys(errors).length > 0 ? '#9ca3af' : '#3b82f6', color: 'white', border: 'none', cursor: saving || Object.keys(errors).length > 0 ? 'not-allowed' : 'pointer', boxShadow: '0 1px 3px rgba(59,130,246,0.3)' }}>
              💾 {saving ? "Menyimpan..." : editingId ? "Perbarui" : "Simpan Data"}
            </button>
          </div>
        </div>
      </form>

      {/* Riwayat Pemberian - Stitch Design */}
      <div style={{ marginTop: 32, background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid #f0f3f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: '#f3f4f6', color: '#6b7280', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🕑</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111518' }}>Riwayat Pemberian</h2>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>MINGGU</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>TANGGAL</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>JUMLAH</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>FORMULASI</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>KETERANGAN</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'right', background: '#f9fafb' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h: any) => (
                <tr key={h.id} style={{ borderBottom: '1px solid #f0f3f5' }}>
                  <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: '#111518' }}>Mg {h.minggu_ke}</td>
                  <td style={{ padding: '16px', fontSize: 14, color: '#6b7280' }}>{new Date(h.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: '#0d9488' }}>{h.jumlah_unit} ml</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      display: 'inline-block', padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 500,
                      background: h.jenis_formulasi === 'F-75' ? '#dbeafe' : h.jenis_formulasi === 'F-100' ? '#dcfce7' : h.jenis_formulasi === 'RUTF' ? '#fef3c7' : '#f3f4f6',
                      color: h.jenis_formulasi === 'F-75' ? '#1d4ed8' : h.jenis_formulasi === 'F-100' ? '#166534' : h.jenis_formulasi === 'RUTF' ? '#92400e' : '#374151'
                    }}>{h.jenis_formulasi}</span>
                  </td>
                  <td style={{ padding: '16px', fontSize: 14, color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.keterangan || '-'}</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <button type="button" onClick={() => {
                        setEditingId(h.id);
                        setForm({ minggu_ke: h.minggu_ke, tanggal: h.tanggal.slice(0, 10), jumlah_unit: String(h.jumlah_unit), jenis_formulasi: h.jenis_formulasi, keterangan: h.keterangan ?? "" });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }} title="Edit" style={{ width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 14 }}>✏️</button>
                      <button type="button" onClick={async () => {
                        if (!confirm('Hapus entri ini?')) return;
                        const r = await fetch('/api/monitoring/pemberian', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: h.id }) });
                        if (!r.ok) { toast.error(await r.text()); return; }
                        toast.success('Dihapus');
                        const rh = await fetch(`/api/monitoring/pemberian?kohort_id=${kohort!.id}`);
                        const dh = await rh.json();
                        setHistory(dh.items || []);
                      }} title="Hapus" style={{ width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontSize: 14 }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Belum ada data pemberian.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          height: 44px;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .input:read-only {
          background: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }
        textarea.input {
          height: auto;
          min-height: 80px;
          resize: vertical;
        }
      `}</style>
    </div>
  );
}
