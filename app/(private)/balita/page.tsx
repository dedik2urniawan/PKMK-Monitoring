"use client";

import { useEffect, useState } from "react";
import BalitaActions from "@/components/BalitaActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  puskesmas_id: string | null;
  sumber_data: string | null;
  created_at: string | null;
  bb_tidak_adekuat: string | null;
  murmur_edema: string | null;
  delayed_development: string | null;
  wajah_dismorfik: string | null;
  organomegali_limfadenopati: string | null;
  ispa_cystitis: string | null;
  muntah_diare_berulang: string | null;
  diagnosa_penyakit_penyerta: string | null;
  keterangan_redflag: string | null;
  redflag_any: boolean | null;
};

type Pkm = { id: string; nama: string };
type Desa = { id: string; desa_kel: string };

function formatTanggal(s: string | null): string {
  if (!s) return "-";
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("id-ID");
}

export default function BalitaList() {
  const [kecList, setKecList] = useState<string[]>([]);
  const [pkmList, setPkmList] = useState<Pkm[]>([]);
  const [desaList, setDesaList] = useState<Desa[]>([]);

  const [kec, setKec] = useState("");
  const [puskesmasId, setPuskesmasId] = useState("");
  const [desa, setDesa] = useState("");
  const [nik, setNik] = useState("");
  const [items, setItems] = useState<Balita[]>([]);
  const [compact, setCompact] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [pageInput, setPageInput] = useState("1");

  function exportCsv() {
    if (!items.length) { alert('Tidak ada data untuk diekspor.'); return; }
    const headers = compact
      ? [
          'nik','nama_balita','jk','tgl_lahir','kec','desa_kel','redflag_any'
        ]
      : [
          'nik','nama_balita','jk','tgl_lahir','bb_lahir_kg','tb_lahir_cm','nama_ortu','kab_kota','kec','desa_kel','posyandu','rt','rw','alamat','puskesmas_id','sumber_data','created_at','bb_tidak_adekuat','murmur_edema','delayed_development','wajah_dismorfik','organomegali_limfadenopati','ispa_cystitis','muntah_diare_berulang','diagnosa_penyakit_penyerta','keterangan_redflag','redflag_any'
        ];
    const rows = items.map((d)=> headers.map((h)=> {
      const v = (d as any)[h];
      if (v == null) return '';
      const s = typeof v === 'string' ? v : (v instanceof Date ? v.toISOString() : String(v));
      return '"' + s.replaceAll('"','""') + '"';
    }).join(','));
    const csv = headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data_balita.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/ref/kecamatan");
      const data = await res.json();
      setKecList(data.items || []);
    })();
  }, []);

  useEffect(() => {
    if (!kec) return;
    (async () => {
      const rp = await fetch(`/api/ref/puskesmas?kecamatan=${encodeURIComponent(kec)}`);
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
      const rd = await fetch(`/api/ref/desa?puskesmas_id=${encodeURIComponent(puskesmasId)}`);
      const d = await rd.json();
      setDesaList((d.items || []).map((r: any) => ({ id: r.id, desa_kel: r.desa_kel })));
    })();
  }, [puskesmasId]);

  async function onSubmit(e?: React.FormEvent) {
    if (e) {
      e.preventDefault();
      // Reset ke halaman 1 ketika filter disubmit
      if (page !== 1) setPage(1);
      setPageInput("1");
    }
    const params = new URLSearchParams();
    if (puskesmasId) params.set("puskesmas_id", puskesmasId);
    if (desa) params.set("desa_kel", desa);
    if (nik) params.set("nik", nik);
    params.set('page', String(e ? 1 : page));
    params.set('limit', String(limit));
    const res = await fetch(`/api/monitoring/balita?${params.toString()}`);
    const data = await res.json();
    setItems(data.items || []);
    setPages(data.pages || 1);
    setTotal(data.total || (data.items?.length ?? 0));
  }

  useEffect(() => {
    onSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Data Balita</h1>
      <div className="mb-3 text-sm flex items-center gap-4">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={compact} onChange={(e)=>setCompact(e.target.checked)} />
          <span>Tampilan ringkas</span>
        </label>
        <button type="button" onClick={exportCsv} className="px-3 py-1.5 rounded border border-[var(--border)] bg-white hover:bg-gray-50">Export CSV</button>
      </div>

      <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-w-5xl">
        <select className="input" value={kec} onChange={(e) => setKec(e.target.value)}>
          <option value="">-- Kecamatan --</option>
          {kecList.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <select className="input" value={puskesmasId} onChange={(e) => setPuskesmasId(e.target.value)}>
          <option value="">-- Puskesmas --</option>
          {pkmList.map((p) => (
            <option key={p.id} value={p.id}>{p.nama}</option>
          ))}
        </select>
        <select className="input" value={desa} onChange={(e) => setDesa(e.target.value)}>
          <option value="">-- Desa/Kel --</option>
          {desaList.map((d) => (
            <option key={d.id} value={d.desa_kel}>{d.desa_kel}</option>
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
            {compact ? (
              <TableRow>
                <TableHead>NIK</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>JK</TableHead>
                <TableHead>Tgl Lahir</TableHead>
                <TableHead>Kec</TableHead>
                <TableHead>Desa/Kel</TableHead>
                <TableHead>Redflag?</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            ) : (
              <TableRow>
                <TableHead>NIK</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>JK</TableHead>
                <TableHead>Tgl Lahir</TableHead>
                <TableHead>BB Lahir (kg)</TableHead>
                <TableHead>TB Lahir (cm)</TableHead>
                <TableHead>Nama Ortu</TableHead>
                <TableHead>Kab/Kota</TableHead>
                <TableHead>Kec</TableHead>
                <TableHead>Desa/Kel</TableHead>
                <TableHead>Posyandu</TableHead>
                <TableHead>RT</TableHead>
                <TableHead>RW</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Puskesmas ID</TableHead>
                <TableHead>Sumber</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>BB tidak adekuat</TableHead>
                <TableHead>Murmur/Edema</TableHead>
                <TableHead>Delayed dev.</TableHead>
                <TableHead>Wajah dismorfik</TableHead>
                <TableHead>Organomegali/LN</TableHead>
                <TableHead>ISPA/Cystitis</TableHead>
                <TableHead>Muntah/Diare</TableHead>
                <TableHead>Dx Penyerta</TableHead>
                <TableHead>Ket. Redflag</TableHead>
                <TableHead>Redflag?</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {items.map((d) => (
              <TableRow key={d.id}>
                {compact ? (
                  <>
                    <TableCell>{d.nik ?? "-"}</TableCell>
                    <TableCell>{d.nama_balita ?? "-"}</TableCell>
                    <TableCell>{d.jk ?? "-"}</TableCell>
                    <TableCell>{formatTanggal(d.tgl_lahir)}</TableCell>
                    <TableCell>{d.kec ?? "-"}</TableCell>
                    <TableCell>{d.desa_kel ?? "-"}</TableCell>
                    <TableCell>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium border ${d.redflag_any ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {d.redflag_any ? 'Ya' : 'Tidak'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a href={`/balita/${encodeURIComponent(d.id)}/edit`} className="px-2 py-1 rounded border border-[var(--border)] bg-white hover:bg-gray-50 text-[13px]">Edit</a>
                        <BalitaActions
                          id={d.id}
                          nik={d.nik ?? undefined}
                          onDeleted={() => setItems((prev) => prev.filter((x) => x.id !== d.id))}
                        />
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{d.nik ?? "-"}</TableCell>
                    <TableCell>{d.nama_balita ?? "-"}</TableCell>
                    <TableCell>{d.jk ?? "-"}</TableCell>
                    <TableCell>{formatTanggal(d.tgl_lahir)}</TableCell>
                    <TableCell>{d.bb_lahir_kg ?? "-"}</TableCell>
                    <TableCell>{d.tb_lahir_cm ?? "-"}</TableCell>
                    <TableCell>{d.nama_ortu ?? "-"}</TableCell>
                    <TableCell>{d.kab_kota ?? "-"}</TableCell>
                    <TableCell>{d.kec ?? "-"}</TableCell>
                    <TableCell>{d.desa_kel ?? "-"}</TableCell>
                    <TableCell>{d.posyandu ?? "-"}</TableCell>
                    <TableCell>{d.rt ?? "-"}</TableCell>
                    <TableCell>{d.rw ?? "-"}</TableCell>
                    <TableCell>{d.alamat ?? "-"}</TableCell>
                    <TableCell>{d.puskesmas_id ?? "-"}</TableCell>
                    <TableCell>{d.sumber_data ?? "-"}</TableCell>
                    <TableCell>{d.created_at ? new Date(d.created_at).toLocaleDateString('id-ID') : '-'}</TableCell>
                    <TableCell>{d.bb_tidak_adekuat ?? "-"}</TableCell>
                    <TableCell>{d.murmur_edema ?? "-"}</TableCell>
                    <TableCell>{d.delayed_development ?? "-"}</TableCell>
                    <TableCell>{d.wajah_dismorfik ?? "-"}</TableCell>
                    <TableCell>{d.organomegali_limfadenopati ?? "-"}</TableCell>
                    <TableCell>{d.ispa_cystitis ?? "-"}</TableCell>
                    <TableCell>{d.muntah_diare_berulang ?? "-"}</TableCell>
                    <TableCell>{d.diagnosa_penyakit_penyerta ?? "-"}</TableCell>
                    <TableCell>{d.keterangan_redflag ?? "-"}</TableCell>
                    <TableCell>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium border ${d.redflag_any ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        {d.redflag_any ? 'Ya' : 'Tidak'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a href={`/balita/${encodeURIComponent(d.id)}/edit`} className="px-2 py-1 rounded border border-[var(--border)] bg-white hover:bg-gray-50 text-[13px]">Edit</a>
                        <BalitaActions
                          id={d.id}
                          nik={d.nik ?? undefined}
                          onDeleted={() => setItems((prev) => prev.filter((x) => x.id !== d.id))}
                        />
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={compact ? 8 : 27} className="text-center text-[var(--muted-foreground)]">Tidak ada data.</TableCell>
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

