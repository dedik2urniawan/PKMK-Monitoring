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
    <div className="w-full pb-28 sm:pb-12">
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#607a8a', marginBottom: 8 }}>
        <span>Anak</span>
        <span style={{ fontSize: 12 }}>›</span>
        <span>Detail</span>
        <span style={{ fontSize: 12 }}>›</span>
        <span style={{ color: '#3b82f6', fontWeight: 500 }}>Tambah Monitoring</span>
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
      <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

        {/* Section 1: Data Pengukuran Dasar */}
        <div className="p-4 sm:p-7 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg shrink-0">🍽️</div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 m-0">Data Konsumsi</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-800">Minggu Ke <span className="text-rose-500">*</span></label>
              <input type="number" min={1} max={12} value={form.minggu_ke} onChange={(e) => setForm({ ...form, minggu_ke: Number(e.target.value) })} className="input" required />
              {errors.minggu_ke && <p className="text-xs text-rose-600 m-0">{errors.minggu_ke}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-sm font-semibold text-slate-800">Tanggal Monitoring <span className="text-rose-500">*</span></label>
              <input type="date" value={form.tanggal} max={today} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="input" required />
              {errors.tanggal && <p className="text-xs text-rose-600 m-0">{errors.tanggal}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Ceklist MT */}
        <div className="p-4 sm:p-7 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg shrink-0">✅</div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 m-0">Ceklist Monitoring MT (Hari 1–7)</h3>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-3">
            {mt.map((v, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <label className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl cursor-pointer border transition ${
                    v ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                    <input type="checkbox" checked={v} onChange={(e) => {
                      const arr = [...mt]; arr[i] = e.target.checked; setMt(arr);
                      const count = arr.filter(Boolean).length;
                      const pct = Math.round((count / 7) * 100);
                      setForm((f) => ({ ...f, kepatuhan_pct: String(pct) }));
                    }} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                    <span className="text-xs font-bold">Hari {i + 1}</span>
                  </label>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>Centang jika konsumsi dilakukan hari ke-{i + 1}</TooltipContent>
              </Tooltip>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-3">
            <span className="text-xs sm:text-sm font-semibold text-slate-600">Kepatuhan:</span>
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
              <div style={{ width: `${form.kepatuhan_pct || 0}%` }} className={`h-full rounded-full transition-all duration-300 ${
                Number(form.kepatuhan_pct) >= 70 ? 'bg-emerald-500' : Number(form.kepatuhan_pct) >= 40 ? 'bg-amber-500' : 'bg-rose-500'
              }`} />
            </div>
            <span className={`text-base sm:text-lg font-black ${
              Number(form.kepatuhan_pct) >= 70 ? 'text-emerald-700' : Number(form.kepatuhan_pct) >= 40 ? 'text-amber-700' : 'text-rose-700'
            }`}>{form.kepatuhan_pct || 0}%</span>
          </div>
        </div>

        {/* Section 3: Pemantauan Kesehatan */}
        <div className="p-4 sm:p-7 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg shrink-0">💊</div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 m-0">Pemantauan Kesehatan</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition ${
              form.catatan === 'Sehat' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}>
              <input type="radio" name="kesehatan" value="Sehat" checked={form.catatan === 'Sehat'} onChange={(e) => setForm({ ...form, catatan: e.target.value })} className="w-4 h-4 accent-emerald-600" />
              <span className="text-sm font-bold">😊 Sehat</span>
            </label>
            <label className={`flex-1 flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition ${
              form.catatan === 'Sakit' ? 'bg-rose-50 border-rose-500 text-rose-900' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}>
              <input type="radio" name="kesehatan" value="Sakit" checked={form.catatan === 'Sakit'} onChange={(e) => setForm({ ...form, catatan: e.target.value })} className="w-4 h-4 accent-rose-600" />
              <span className="text-sm font-bold">🤒 Sakit</span>
            </label>
          </div>
        </div>

        {/* Form Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 sm:p-6 bg-slate-50 border-t border-slate-200">
          <p className="text-xs text-slate-500 italic m-0">* Kolom bertanda bintang wajib diisi</p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ minggu_ke: 1, tanggal: "", kepatuhan_pct: "", catatan: "" }); setMt([false, false, false, false, false, false, false]); }}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold transition">
                Batal
              </button>
            )}
            <button type="submit" disabled={saving || Object.keys(errors).length > 0}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 transition shadow-sm ${
                saving || Object.keys(errors).length > 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}>
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
