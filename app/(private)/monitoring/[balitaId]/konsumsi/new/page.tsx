"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Kohort = { id: string; periode_mulai?: string } | null;

export default function NewKonsumsi() {
  const params = useParams<{ balitaId: string }>();
  const [kohort, setKohort] = useState<Kohort>(null);
  const [balitaName, setBalitaName] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ minggu_ke: 1, tanggal: "", kepatuhan_pct: "", catatan: "" });
  const [mt, setMt] = useState([false,false,false,false,false,false,false]);
  const [history, setHistory] = useState<Array<{id:string; minggu_ke:number; tanggal:string; kepatuhan_pct:number|null; catatan:string|null}>>([]);
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
      setHistory(data.items || []);
    })();
  }, [kohort]);

  useEffect(() => {
    (async () => {
      const rb = await fetch(`/api/monitoring/balita?balita_id=${params.balitaId}`);
      const db = await rb.json();
      const it = (db.items || [])[0];
      setBalitaName(it?.nama_balita || "");
    })();
  }, [params.balitaId]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!(form.minggu_ke >= 1 && form.minggu_ke <= 12)) e.minggu_ke = "Minggu ke harus 1-12";
    // kepatuhan dihitung otomatis dari ceklist MT
    if (!form.tanggal) e.tanggal = "Wajib diisi";
    return e;
  }, [form]);

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
    const res = await fetch("/api/monitoring/konsumsi", { method: editingId ? "PATCH" : "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload)});
    setSaving(false);
    if (!res.ok) { const t = await res.text(); setMsg(t); toast.error(t); return; }
    toast.success(editingId ? "Perubahan disimpan" : "Tersimpan");
    try {
      const rh = await fetch(`/api/monitoring/konsumsi?kohort_id=${kohort.id}`);
      const dh = await rh.json();
      setHistory(dh.items || []);
      setEditingId(null);
      setMt([false,false,false,false,false,false,false]);
    } catch {}
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold mb-2">Tambah Monitoring: PKMK Konsumsi</h1>
      {(balitaName || kohort) && (
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
          {balitaName ? <><span className="font-medium">{balitaName}</span> — </> : null}
          {kohort ? <>Kohort mulai {new Date(kohort.periode_mulai as any).toLocaleDateString('id-ID')}</> : "Kohort belum dimulai"}
        </p>
      )}
      {msg && <div className="mb-3 text-sm p-3 rounded bg-blue-50">{msg}</div>}
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><label className="text-sm">Minggu Ke*</label>
          <input type="number" min={1} max={12} value={form.minggu_ke} onChange={(e)=>setForm({...form, minggu_ke: Number(e.target.value)})} className="input" required />
          {errors.minggu_ke && <p className="text-xs text-red-600 mt-1">{errors.minggu_ke}</p>}
        </div>
        <div><label className="text-sm">Tanggal Monitoring PKMK*</label>
          <input type="date" value={form.tanggal} onChange={(e)=>setForm({...form, tanggal: e.target.value})} className="input" required />
          {errors.tanggal && <p className="text-xs text-red-600 mt-1">{errors.tanggal}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="text-sm">Ceklist Monitoring MT (1–7, retrospektif)</label>
          <div className="grid grid-cols-7 gap-2 mt-1">
            {mt.map((v, i)=> (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <label className="flex items-center justify-center gap-2 border rounded p-2 cursor-pointer">
                    <input type="checkbox" checked={v} onChange={(e)=>{
                      const arr = [...mt]; arr[i] = e.target.checked; setMt(arr);
                      const count = arr.filter(Boolean).length;
                      const pct = Math.round((count/7)*100);
                      setForm((f)=>({...f, kepatuhan_pct: String(pct)}));
                    }} />
                    <span>{i+1}</span>
                  </label>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>Centang jika konsumsi dilakukan hari ke-{i+1}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
        <div className="md:col-span-2"><label className="text-sm">Kepatuhan (%)</label>
          <input type="number" min={0} max={100} value={form.kepatuhan_pct} className="input" readOnly />
        </div>
        <div className="md:col-span-2"><label className="text-sm">Pemantauan Kesehatan</label>
          <select value={form.catatan} onChange={(e)=>setForm({...form, catatan: e.target.value})} className="input">
            <option value="">- Pilih -</option>
            <option value="Sehat">Sehat</option>
            <option value="Sakit">Sakit</option>
          </select>
        </div>
        <div className="md:col-span-2 flex items-center gap-2">
          <button disabled={saving || Object.keys(errors).length>0} className="px-4 py-2 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded">{saving?"Menyimpan...": editingId?"Perbarui":"Simpan"}</button>
          {editingId && (
            <button type="button" onClick={()=>{setEditingId(null); setForm({ minggu_ke:1, tanggal:"", kepatuhan_pct:"", catatan:""}); }} className="px-3 py-2 border rounded">Batal</button>
          )}
        </div>
      </form>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Riwayat Konsumsi</h2>
        <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
          <Table>
            <TableHeader className="bg-[var(--background)]">
              <TableRow>
                <TableHead>Minggu</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kepatuhan (%)</TableHead>
                <TableHead>Pemantauan Kesehatan</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>{h.minggu_ke}</TableCell>
                  <TableCell>{new Date(h.tanggal).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>{h.kepatuhan_pct ?? '-'}</TableCell>
                  <TableCell>{h.catatan ?? '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button className="text-[var(--primary-700)] underline" onClick={() => { setEditingId(h.id); setForm({ minggu_ke: h.minggu_ke, tanggal: h.tanggal.slice(0,10), kepatuhan_pct: h.kepatuhan_pct?.toString() ?? "", catatan: h.catatan ?? "" }); setMt([false,false,false,false,false,false,false]); }}>Edit</button>
                      <button className="text-red-600 underline" onClick={async ()=>{ if(!confirm('Hapus entri ini?')) return; const r = await fetch('/api/monitoring/konsumsi', { method:'DELETE', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: h.id }) }); if(!r.ok){ toast.error(await r.text()); return;} toast.success('Dihapus'); const rh = await fetch(`/api/monitoring/konsumsi?kohort_id=${kohort!.id}`); const dh = await rh.json(); setHistory(dh.items||[]); }}>Hapus</button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[var(--muted-foreground)]">Belum ada data konsumsi.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <style jsx>{`.input{width:100%;border:1px solid #d1d5db;border-radius:.5rem;padding:.5rem .75rem;}`}</style>
    </div>
  );
}
