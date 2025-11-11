"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Ruler, UtensilsCrossed, HandHeart } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Balita = { id: string; nik: string | null; nama_balita: string; desa_kel: string | null; puskesmas_id: string };
type Pkm = { id: string; nama: string };
type Desa = { id: string; desa_kel: string };

export default function MonitoringIndex() {
  const [kecList, setKecList] = useState<string[]>([]);
  const [pkmList, setPkmList] = useState<Pkm[]>([]);
  const [desaList, setDesaList] = useState<Desa[]>([]);

  const [kec, setKec] = useState("");
  const [puskesmasId, setPuskesmasId] = useState("");
  const [desa, setDesa] = useState("");
  const [nik, setNik] = useState("");
  const [items, setItems] = useState<Balita[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [pageInput, setPageInput] = useState("1");

  useEffect(() => {
    (async () => {
      // Sync server-side Supabase session to avoid ALL dropdowns on first load
      try {
        const { getSupabase } = await import('@/lib/supabase/client');
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        const s = data.session;
        if (s?.access_token && s.refresh_token) {
          await fetch('/api/auth/session', { method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify({ access_token: s.access_token, refresh_token: s.refresh_token }) });
        }
      } catch {}
      const res = await fetch("/api/ref/kecamatan", { credentials: 'include' });
      const data = await res.json();
      setKecList(data.items || []);
    })();
  }, []);

  useEffect(() => {
    if (!kec) return;
    (async () => {
      const rp = await fetch(`/api/ref/puskesmas?kecamatan=${encodeURIComponent(kec)}`, { credentials: 'include' });
      const p = await rp.json();
      setPkmList((p.items || []).map((r: any) => ({ id: r.id, nama: r.nama })));
      setDesaList([]);
      setDesa("");
      setPuskesmasId("");
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

  async function onSubmit(e?: React.FormEvent) {
    if (e) {
      e.preventDefault();
      if (page !== 1) setPage(1);
      setPageInput("1");
    }
    const params = new URLSearchParams();
    if (puskesmasId) params.set("puskesmas_id", puskesmasId);
    if (desa) params.set("desa_kel", desa);
    if (nik) params.set("nik", nik);
    params.set('page', String(e ? 1 : page));
    params.set('limit', String(limit));
    const res = await fetch(`/api/monitoring/balita?${params.toString()}`, { credentials: 'include' });
    const data = await res.json();
    setItems(data.items || []);
    setPages(data.pages || 1);
    setTotal(data.total || (data.items?.length ?? 0));
  }

  // reload when page or limit changes
  useEffect(() => {
    onSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  useEffect(() => { setPageInput(String(page)); }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Monitoring PKMK</h1>
      <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-w-5xl">
        <select className="input" value={kec} onChange={(e) => setKec(e.target.value)}>
          <option value="">-- Kecamatan --</option>
          {kecList.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <select className="input" value={puskesmasId} onChange={(e) => setPuskesmasId(e.target.value)}>
          <option value="">-- Puskesmas --</option>
          {pkmList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </select>
        <select className="input" value={desa} onChange={(e) => setDesa(e.target.value)}>
          <option value="">-- Desa/Kel --</option>
          {desaList.map((d) => (
            <option key={d.id} value={d.desa_kel}>
              {d.desa_kel}
            </option>
          ))}
        </select>
        <input className="input" placeholder="NIK" value={nik} onChange={(e) => setNik(e.target.value)} />
        <div className="sm:col-span-2">
          <button className="px-4 py-2 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded">Filter</button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <Table>
          <TableHeader className="bg-[var(--background)]">
            <TableRow>
              <TableHead>NIK</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Desa/Kel</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.nik ?? "-"}</TableCell>
                <TableCell>{b.nama_balita}</TableCell>
                <TableCell>{b.desa_kel ?? "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link
                      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white hover:bg-emerald-50 px-2.5 py-1.5 text-[var(--primary-700)]"
                      href={`/monitoring/${b.id}/antropometri/new`}
                      aria-label="Antropometri"
                      title="Antropometri"
                    >
                      <Ruler size={16} />
                      <span className="text-[13px]">Antropometri</span>
                    </Link>
                    <Link
                      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white hover:bg-emerald-50 px-2.5 py-1.5 text-[var(--primary-700)]"
                      href={`/monitoring/${b.id}/konsumsi/new`}
                      aria-label="Konsumsi"
                      title="Konsumsi"
                    >
                      <UtensilsCrossed size={16} />
                      <span className="text-[13px]">Konsumsi</span>
                    </Link>
                    <Link
                      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white hover:bg-emerald-50 px-2.5 py-1.5 text-[var(--primary-700)]"
                      href={`/monitoring/${b.id}/pemberian/new`}
                      aria-label="Pemberian"
                      title="Pemberian"
                    >
                      <HandHeart size={16} />
                      <span className="text-[13px]">Pemberian</span>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[var(--muted-foreground)]">
                  Belum ada data hasil filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3 text-sm">
        <div>
          Menampilkan {items.length} dari {total} data
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              className="h-8 rounded-md border border-[var(--border)] bg-white px-2"
              value={limit}
              onChange={(e)=>{ setLimit(Number(e.target.value)); setPage(1); }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage(1)}
            disabled={page <= 1}
          >
            First
          </button>
          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Prev
          </button>
          <span className="inline-flex items-center gap-2">
            Hal
            <input
              type="number"
              min={1}
              max={pages}
              value={pageInput}
              onChange={(e)=> setPageInput(e.target.value)}
              onKeyDown={(e)=>{
                if (e.key === 'Enter') {
                  const n = Math.max(1, Math.min(pages, Number(pageInput) || 1));
                  setPage(n);
                }
              }}
              className="w-16 h-8 rounded-md border border-[var(--border)] bg-white px-2 text-center"
            />
            / {pages}
            <button
              type="button"
              className="px-2 py-1 border rounded"
              onClick={()=>{ const n = Math.max(1, Math.min(pages, Number(pageInput) || 1)); setPage(n); }}
            >
              Go
            </button>
          </span>
          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page >= pages}
          >
            Next
          </button>
          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage(pages)}
            disabled={page >= pages}
          >
            Last
          </button>
        </div>
      </div>
      <style jsx>{`
        .input{width:100%;border:1px solid #d1d5db;border-radius:.5rem;padding:.5rem .75rem;}
      `}</style>
    </div>
  );
}


