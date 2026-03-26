"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAuthHeaders } from "@/lib/clientSession";

type Kohort = { id: string; periode_mulai?: string } | null;
type Balita = { id: string; nama_balita: string; jk?: 'L' | 'P' } | null;

export default function NewKonsumsi() {
  const params = useParams<{ balitaId: string }>();
  const [kohort, setKohort] = useState<Kohort>(null);
  const [balita, setBalita] = useState<Balita>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ minggu_ke: 1, tanggal: "", kepatuhan_pct: "", catatan: "" });
  const [mt, setMt] = useState([false, false, false, false, false, false, false]);
  const [history, setHistory] = useState<Array<{ id: string; minggu_ke: number; tanggal: string; kepatuhan_pct: number | null; catatan: string | null }>>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch(`/api/kohort/by-balita?balita_id=${params.balitaId}`);
      const d = await r.json();
      setKohort(d.item ?? null);
    })();
  }, [params.balitaId]);

  useEffect(() => {
    if (!kohort) return;
    (async () => {
      const res = await fetch(`/api/monitoring/konsumsi?kohort_id=${kohort.id}`);
      const data = await res.json();
      const items = data.items || [];
      setHistory(items);
      if (items.length > 0 && !editingId) {
        const maxMinggu = Math.max(...items.map((h: any) => h.minggu_ke || 0));
        const nextMinggu = Math.min(12, maxMinggu + 1);
        setForm((f) => ({ ...f, minggu_ke: nextMinggu }));
      }
    })();
  }, [kohort, editingId]);

  useEffect(() => {
    (async () => {
      const rb = await fetch(`/api/monitoring/balita?balita_id=${params.balitaId}`);
      const db = await rb.json();
      const it = (db.items || [])[0];
      setBalita(it ? { id: it.id, nama_balita: it.nama_balita, jk: it.jk } : null);
    })();
  }, [params.balitaId]);

  const today = new Date().toISOString().split('T')[0];

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!(form.minggu_ke >= 1 && form.minggu_ke <= 12)) e.minggu_ke = "Minggu ke harus 1-12";
    if (!form.tanggal) e.tanggal = "Wajib diisi";
    else if (form.tanggal > today) e.tanggal = "Tanggal tidak boleh melebihi hari ini";
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
      kepatuhan_pct: form.kepatuhan_pct === "" ? undefined : Number(form.kepatuhan_pct),
      catatan: form.catatan || undefined,
    };
    const authHeaders = await getAuthHeaders();
    const res = await fetch("/api/monitoring/konsumsi", { method: editingId ? "PATCH" : "POST", credentials: "include", headers: { "Content-Type": "application/json", ...authHeaders }, body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload) });
    setSaving(false);
    if (!res.ok) { const t = await res.text(); setMsg(t); toast.error(t); return; }
    toast.success(editingId ? "Perubahan disimpan" : "Tersimpan");
    try {
      const rh = await fetch(`/api/monitoring/konsumsi?kohort_id=${kohort.id}`);
      const dh = await rh.json();
      setHistory(dh.items || []);
      setEditingId(null);
      setMt([false, false, false, false, false, false, false]);
      setForm({ minggu_ke: 1, tanggal: "", kepatuhan_pct: "", catatan: "" });
    } catch { }
  }

  return (
    <div className="w-full">
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#607a8a', marginBottom: 8 }}>
        <span>Anak</span>
        <span style={{ fontSize: 12 }}>›</span>
        <span>Detail</span>
        <span style={{ fontSize: 12 }}>›</span>
        <span style={{ color: '#3b82f6', fontWeight: 500 }}>Monitoring Konsumsi</span>
      </div>

      {/* Page Title */}
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111518', marginBottom: 8 }}>Tambah Monitoring: Konsumsi</h1>

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
            <div style={{ width: 40, height: 40, background: '#fef3c7', color: '#d97706', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🍽️</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111518' }}>Data Konsumsi</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28 }} className="form-grid-responsive">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111518' }}>Minggu Ke <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="number" min={1} max={12} value={form.minggu_ke} onChange={(e) => setForm({ ...form, minggu_ke: Number(e.target.value) })} className="input" required />
              {errors.minggu_ke && <p style={{ fontSize: 12, color: '#dc2626' }}>{errors.minggu_ke}</p>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#111518' }}>Tanggal Monitoring <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" value={form.tanggal} max={today} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="input" required />
              {errors.tanggal && <p style={{ fontSize: 12, color: '#dc2626' }}>{errors.tanggal}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Ceklist MT */}
        <div style={{ padding: '28px 32px', borderBottom: '1px solid #f0f3f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, background: '#ecfdf5', color: '#10b981', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✅</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111518' }}>Ceklist Monitoring MT (1–7)</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
            {mt.map((v, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <label style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '16px 8px', border: v ? '2px solid #10b981' : '1px solid #e5e7eb',
                    borderRadius: 10, cursor: 'pointer', background: v ? '#ecfdf5' : 'white',
                    transition: 'all 0.2s'
                  }}>
                    <input type="checkbox" checked={v} onChange={(e) => {
                      const arr = [...mt]; arr[i] = e.target.checked; setMt(arr);
                      const count = arr.filter(Boolean).length;
                      const pct = Math.round((count / 7) * 100);
                      setForm((f) => ({ ...f, kepatuhan_pct: String(pct) }));
                    }} style={{ width: 20, height: 20, accentColor: '#10b981' }} />
                    <span style={{ fontWeight: 600, fontSize: 14, color: v ? '#059669' : '#6b7280' }}>Hari {i + 1}</span>
                  </label>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>Centang jika konsumsi dilakukan hari ke-{i + 1}</TooltipContent>
              </Tooltip>
            ))}
          </div>
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 14, color: '#6b7280' }}>Kepatuhan:</span>
            <div style={{ flex: 1, height: 12, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${form.kepatuhan_pct || 0}%`, height: '100%', background: Number(form.kepatuhan_pct) >= 70 ? '#22c55e' : Number(form.kepatuhan_pct) >= 40 ? '#eab308' : '#ef4444', borderRadius: 6, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: Number(form.kepatuhan_pct) >= 70 ? '#16a34a' : Number(form.kepatuhan_pct) >= 40 ? '#ca8a04' : '#dc2626' }}>{form.kepatuhan_pct || 0}%</span>
          </div>
        </div>

        {/* Section 3: Pemantauan Kesehatan */}
        <div style={{ padding: '28px 32px', borderBottom: '1px solid #f0f3f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, background: '#eff6ff', color: '#3b82f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>💊</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111518' }}>Pemantauan Kesehatan</h3>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px',
              border: form.catatan === 'Sehat' ? '2px solid #22c55e' : '1px solid #e5e7eb',
              borderRadius: 10, cursor: 'pointer', background: form.catatan === 'Sehat' ? '#f0fdf4' : 'white'
            }}>
              <input type="radio" name="kesehatan" value="Sehat" checked={form.catatan === 'Sehat'} onChange={(e) => setForm({ ...form, catatan: e.target.value })} style={{ width: 20, height: 20, accentColor: '#22c55e' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: form.catatan === 'Sehat' ? '#16a34a' : '#374151' }}>😊 Sehat</span>
            </label>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '16px 24px',
              border: form.catatan === 'Sakit' ? '2px solid #ef4444' : '1px solid #e5e7eb',
              borderRadius: 10, cursor: 'pointer', background: form.catatan === 'Sakit' ? '#fef2f2' : 'white'
            }}>
              <input type="radio" name="kesehatan" value="Sakit" checked={form.catatan === 'Sakit'} onChange={(e) => setForm({ ...form, catatan: e.target.value })} style={{ width: 20, height: 20, accentColor: '#ef4444' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: form.catatan === 'Sakit' ? '#dc2626' : '#374151' }}>🤒 Sakit</span>
            </label>
          </div>
        </div>

        {/* Form Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: '#f9fafb' }}>
          <p style={{ fontSize: 14, color: '#6b7280', fontStyle: 'italic' }}>* Kolom wajib diisi</p>
          <div style={{ display: 'flex', gap: 12 }}>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ minggu_ke: 1, tanggal: "", kepatuhan_pct: "", catatan: "" }); setMt([false, false, false, false, false, false, false]); }}
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

      {/* Riwayat Konsumsi - Stitch Design */}
      <div style={{ marginTop: 32, background: 'white', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderBottom: '1px solid #f0f3f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: '#f3f4f6', color: '#6b7280', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🕑</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111518' }}>Riwayat Konsumsi</h2>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>MINGGU</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>TANGGAL</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>KEPATUHAN</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'left', background: '#f9fafb' }}>KESEHATAN</th>
                <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', textAlign: 'right', background: '#f9fafb' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} style={{ borderBottom: '1px solid #f0f3f5' }}>
                  <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: '#111518' }}>Mg {h.minggu_ke}</td>
                  <td style={{ padding: '16px', fontSize: 14, color: '#6b7280' }}>{new Date(h.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 60, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${h.kepatuhan_pct || 0}%`, height: '100%', background: (h.kepatuhan_pct || 0) >= 70 ? '#22c55e' : (h.kepatuhan_pct || 0) >= 40 ? '#eab308' : '#ef4444', borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: (h.kepatuhan_pct || 0) >= 70 ? '#16a34a' : (h.kepatuhan_pct || 0) >= 40 ? '#ca8a04' : '#dc2626' }}>{h.kepatuhan_pct ?? 0}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {h.catatan ? (
                      <span style={{
                        display: 'inline-block', padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 500,
                        background: h.catatan === 'Sehat' ? '#dcfce7' : '#fee2e2',
                        color: h.catatan === 'Sehat' ? '#166534' : '#991b1b'
                      }}>{h.catatan === 'Sehat' ? '😊 Sehat' : '🤒 Sakit'}</span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <button type="button" onClick={() => {
                        setEditingId(h.id);
                        setForm({ minggu_ke: h.minggu_ke, tanggal: h.tanggal.slice(0, 10), kepatuhan_pct: h.kepatuhan_pct?.toString() ?? "", catatan: h.catatan ?? "" });
                        setMt([false, false, false, false, false, false, false]);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }} title="Edit" style={{ width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#374151', border: 'none', cursor: 'pointer', fontSize: 14 }}>✏️</button>
                      <button type="button" onClick={async () => {
                        if (!confirm('Hapus entri ini?')) return;
                        const r = await fetch('/api/monitoring/konsumsi', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: h.id }) });
                        if (!r.ok) { toast.error(await r.text()); return; }
                        toast.success('Dihapus');
                        const rh = await fetch(`/api/monitoring/konsumsi?kohort_id=${kohort!.id}`);
                        const dh = await rh.json();
                        setHistory(dh.items || []);
                      }} title="Hapus" style={{ width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', fontSize: 14 }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Belum ada data konsumsi.</td>
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
      `}</style>
    </div>
  );
}
