"use client";
import { useEffect, useState } from "react";

type Balita = { id: string; nama_balita: string };
type Pkm = { id: string; nama: string };
type Desa = { id: string; desa_kel: string };

export default function NewKohort() {
  const [loading, setLoading] = useState(true);
  const [balita, setBalita] = useState<Balita[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [start, setStart] = useState<string>("");

  // filter state
  const [kecList, setKecList] = useState<string[]>([]);
  const [pkmList, setPkmList] = useState<Pkm[]>([]);
  const [desaList, setDesaList] = useState<Desa[]>([]);
  const [kec, setKec] = useState("");
  const [puskesmasId, setPuskesmasId] = useState("");
  const [desa, setDesa] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/ref/kecamatan", { credentials: 'include' });
        const data = await res.json();
        setKecList(data.items || []);
      } catch {}
      const r = await fetch("/api/monitoring/balita", { credentials: 'include' });
      const d = await r.json();
      setBalita(d.items || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!kec) return;
    (async () => {
      const rp = await fetch(`/api/ref/puskesmas?kecamatan=${encodeURIComponent(kec)}`, { credentials: 'include' });
      const p = await rp.json();
      setPkmList((p.items || []).map((r: any) => ({ id: r.id, nama: r.nama })));
      setDesaList([]); setDesa(""); setPuskesmasId("");
    })();
  }, [kec]);

  useEffect(() => {
    if (!puskesmasId) return;
    (async () => {
      const rd = await fetch(`/api/ref/desa?puskesmas_id=${encodeURIComponent(puskesmasId)}`, { credentials: 'include' });
      const d = await rd.json();
      setDesaList((d.items || []).map((r: any) => ({ id: r.id, desa_kel: r.desa_kel })));
    })();
  }, [puskesmasId]);

  async function applyFilter(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (puskesmasId) params.set("puskesmas_id", puskesmasId);
    if (desa) params.set("desa_kel", desa);
    const r = await fetch(`/api/monitoring/balita?${params.toString()}`);
    const d = await r.json();
    setBalita(d.items || []);
    setSelected("");
  }

  async function createKohort() {
    // Sertakan token akses agar server dapat mengidentifikasi user saat cookies tidak terbaca
    let authHeader: Record<string, string> = {};
    try {
      const { getSupabase } = await import('@/lib/supabase/client');
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) authHeader = { Authorization: `Bearer ${token}` };
    } catch {}

    const res = await fetch("/api/kohort", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      credentials: "include",
      body: JSON.stringify({ balita_id: selected, periode_mulai: start }),
    });
    if (!res.ok) return alert(await res.text());
    alert("Kohort dimulai!");
  }

  if (loading) return <div>Memuat…</div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Mulai Kohort (12 minggu)</h1>

      <form onSubmit={applyFilter} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <select className="input" value={kec} onChange={(e)=>setKec(e.target.value)}>
          <option value="">-- Kecamatan --</option>
          {kecList.map((k)=> (<option key={k} value={k}>{k}</option>))}
        </select>
        <select className="input" value={puskesmasId} onChange={(e)=>setPuskesmasId(e.target.value)}>
          <option value="">-- Puskesmas --</option>
          {pkmList.map((p)=> (<option key={p.id} value={p.id}>{p.nama}</option>))}
        </select>
        <select className="input" value={desa} onChange={(e)=>setDesa(e.target.value)}>
          <option value="">-- Desa/Kel --</option>
          {desaList.map((d)=> (<option key={d.id} value={d.desa_kel}>{d.desa_kel}</option>))}
        </select>
        <div>
          <button className="px-4 py-2 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded">Filter</button>
        </div>
      </form>

      <div className="space-y-3">
        <select className="input" value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">-- Pilih Balita --</option>
          {balita.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nama_balita}
            </option>
          ))}
        </select>
        <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <button
          className="px-4 py-2 bg-emerald-600 text-white rounded disabled:opacity-60"
          onClick={createKohort}
          disabled={!selected || !start}
        >
          Mulai
        </button>
      </div>
      <style jsx>{`.input{width:100%;border:1px solid #d1d5db;border-radius:.5rem;padding:.5rem .75rem;}`}</style>
    </div>
  );
}
