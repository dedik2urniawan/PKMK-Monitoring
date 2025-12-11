"use client";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
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

// Helper Component for History Grid
const HistoryCell = ({
  weeks,
  color = "bg-emerald-500",
  onWeekClick
}: {
  weeks: number[],
  color?: string,
  onWeekClick?: (week: number) => void
}) => {
  // Map Tailwind classes to hex colors for inline styles
  const colorMap: Record<string, string> = {
    'bg-blue-500': '#3b82f6',
    'bg-emerald-500': '#10b981',
    'bg-purple-500': '#a855f7',
    'bg-gray-200': '#e5e7eb'
  };

  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => {
        const active = weeks.includes(w);
        return (
          <div
            key={w}
            onClick={(e) => {
              e.stopPropagation();
              if (active && onWeekClick) {
                onWeekClick(w);
              }
            }}
            style={{
              padding: '2px',
              cursor: active ? 'pointer' : 'default'
            }}
            title={`Minggu ${w}: ${active ? "Sudah (klik untuk detail)" : "Belum"}`}
          >
            <div
              style={{
                width: '10px',
                height: '16px',
                borderRadius: '1px',
                backgroundColor: active ? (colorMap[color] || colorMap['bg-gray-200']) : colorMap['bg-gray-200']
              }}
              className={active ? 'hover:opacity-75 transition-opacity' : ''}
            />
          </div>
        );
      })}
    </div>
  );
};

export default function MonitoringIndex() {
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
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
      await ensureServerSession();
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/ref/kecamatan", { credentials: 'include', headers: authHeaders });
      const data = await res.json();
      const items: string[] = data.items || [];
      setKecList(items);
      if (items.length === 1) {
        setKec((prev) => prev || items[0]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!kec) {
      setPkmList([]);
      setPuskesmasId("");
      setDesaList([]);
      setDesa("");
      return;
    }
    (async () => {
      await ensureServerSession();
      const authHeaders = await getAuthHeaders();
      const rp = await fetch(`/api/ref/puskesmas?kecamatan=${encodeURIComponent(kec)}`, { credentials: 'include', headers: authHeaders });
      const p = await rp.json();
      const mapped = (p.items || []).map((r: any) => ({ id: r.id, nama: r.nama }));
      setPkmList(mapped);
      setDesaList([]);
      setDesa("");
      setPuskesmasId(mapped.length === 1 ? mapped[0].id : "");
    })();
  }, [kec]);

  useEffect(() => {
    if (!puskesmasId) return;
    (async () => {
      await ensureServerSession();
      const authHeaders = await getAuthHeaders();
      const rd = await fetch(`/api/ref/desa?puskesmas_id=${encodeURIComponent(puskesmasId)}`, { credentials: 'include', headers: authHeaders });
      const d = await rd.json();
      const mapped = (d.items || []).map((r: any) => ({ id: r.id, desa_kel: r.desa_kel }));
      setDesaList(mapped);
      if (mapped.length === 1) {
        setDesa((prev) => prev || mapped[0].desa_kel);
      }
    })();
  }, [puskesmasId]);

  async function onSubmit(e?: React.FormEvent) {
    if (e) {
      e.preventDefault();
      if (page !== 1) setPage(1);
      setPageInput("1");
    }
    const params = new URLSearchParams();
    if (kec) params.set("kec", kec);
    if (puskesmasId) params.set("puskesmas_id", puskesmasId);
    if (desa) params.set("desa_kel", desa);
    if (nik) params.set("nik", nik);
    params.set('page', String(e ? 1 : page));
    params.set('limit', String(limit));
    await ensureServerSession();
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`/api/monitoring/balita?${params.toString()}`, { credentials: 'include', headers: authHeaders });
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
      <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6 max-w-7xl items-end">
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
        <div>
          <button className="w-full px-4 py-2 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded">Filter</button>
        </div>
      </form>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
        <span className="text-sm font-semibold text-gray-700">Legend:</span>
        <div className="flex items-center gap-2">
          <div style={{ backgroundColor: '#3b82f6', width: '12px', height: '12px', borderRadius: '2px' }} />
          <span className="text-xs text-gray-600">Antropometri</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ backgroundColor: '#10b981', width: '12px', height: '12px', borderRadius: '2px' }} />
          <span className="text-xs text-gray-600">Konsumsi</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ backgroundColor: '#a855f7', width: '12px', height: '12px', borderRadius: '2px' }} />
          <span className="text-xs text-gray-600">Pemberian</span>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ backgroundColor: '#e5e7eb', width: '12px', height: '12px', borderRadius: '2px' }} />
          <span className="text-xs text-gray-600">Belum Diisi</span>
        </div>
        <span className="text-xs text-gray-500 ml-2 italic">💡 Klik kotak berwarna untuk lihat detail</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--surface)]">
        <Table>
          <TableHeader className="bg-[var(--background)]">
            <TableRow>
              <TableHead className="text-center w-[150px]">NIK</TableHead>
              <TableHead className="text-center min-w-[150px]">Nama</TableHead>
              <TableHead className="text-center w-[150px]">Desa/Kel</TableHead>
              <TableHead className="text-center w-[140px]">Antropometri (W1-12)</TableHead>
              <TableHead className="text-center w-[140px]">Konsumsi (W1-12)</TableHead>
              <TableHead className="text-center w-[140px]">Pemberian (W1-12)</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((b: any, idx: number) => {
              // Aggregate history from ALL cohorts to ensure data visibility
              // This covers cases where data might be split or dates are unordered
              const cohorts = b.kohort || [];

              const antroWeeks: number[] = Array.from(new Set(
                cohorts.flatMap((c: any) => c.monitoring_antropometri || [])
                  .map((m: any) => Number(m.minggu_ke))
                  .filter((w: number) => !isNaN(w))
              ));
              const konsumsiWeeks: number[] = Array.from(new Set(
                cohorts.flatMap((c: any) => c.monitoring_pkmk_konsumsi || [])
                  .map((m: any) => Number(m.minggu_ke))
                  .filter((w: number) => !isNaN(w))
              ));
              const pemberianWeeks: number[] = Array.from(new Set(
                cohorts.flatMap((c: any) => c.monitoring_pkmk_pemberian || [])
                  .map((m: any) => Number(m.minggu_ke))
                  .filter((w: number) => !isNaN(w))
              ));

              return (
                <TableRow key={b.id}>
                  <TableCell className="font-medium text-xs">{b.nik ?? "-"}</TableCell>
                  <TableCell className="font-medium">{b.nama_balita}</TableCell>
                  <TableCell className="text-xs text-gray-500">{b.desa_kel ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <HistoryCell
                        weeks={antroWeeks}
                        color="bg-blue-500"
                        onWeekClick={(week) => {
                          const data = cohorts.flatMap((c: any) => c.monitoring_antropometri || [])
                            .find((m: any) => m.minggu_ke === week);
                          setModalData({ ...data, balitaName: b.nama_balita, week, type: 'Antropometri' });
                          setModalOpen(true);
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <HistoryCell
                        weeks={konsumsiWeeks}
                        color="bg-emerald-500"
                        onWeekClick={(week) => {
                          const data = cohorts.flatMap((c: any) => c.monitoring_pkmk_konsumsi || [])
                            .find((m: any) => m.minggu_ke === week);
                          setModalData({ ...data, balitaName: b.nama_balita, week, type: 'Konsumsi' });
                          setModalOpen(true);
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <HistoryCell
                        weeks={pemberianWeeks}
                        color="bg-purple-500"
                        onWeekClick={(week) => {
                          const data = cohorts.flatMap((c: any) => c.monitoring_pkmk_pemberian || [])
                            .find((m: any) => m.minggu_ke === week);
                          setModalData({ ...data, balitaName: b.nama_balita, week, type: 'Pemberian' });
                          setModalOpen(true);
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white hover:bg-emerald-50 px-2 py-1 text-[var(--primary-700)] text-xs"
                        href={`/monitoring/${b.id}/antropometri/new`}
                        title="Antropometri"
                      >
                        <Ruler size={14} />
                        <span className="hidden xl:inline">Antro</span>
                      </Link>
                      <Link
                        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white hover:bg-emerald-50 px-2 py-1 text-[var(--primary-700)] text-xs"
                        href={`/monitoring/${b.id}/konsumsi/new`}
                        title="Konsumsi"
                      >
                        <UtensilsCrossed size={14} />
                        <span className="hidden xl:inline">Konsumsi</span>
                      </Link>
                      <Link
                        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-white hover:bg-emerald-50 px-2 py-1 text-[var(--primary-700)] text-xs"
                        href={`/monitoring/${b.id}/pemberian/new`}
                        title="Pemberian"
                      >
                        <HandHeart size={14} />
                        <span className="hidden xl:inline">Pemberian</span>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-[var(--muted-foreground)] py-8">
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
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
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
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={(e) => {
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
              onClick={() => { const n = Math.max(1, Math.min(pages, Number(pageInput) || 1)); setPage(n); }}
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

      {/* Modal for Weekly Details */}
      {modalOpen && modalData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
          onClick={() => setModalOpen(false)}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                Detail Monitoring - {modalData.type}
              </h2>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                {modalData.balitaName} • Minggu {modalData.week}
                {modalData.tanggal && (
                  <span> •{' ' + new Date(modalData.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                )}
              </p>
            </div>

            {/* Body */}
            <div>
              {modalData.type === 'Antropometri' && (
                <div>
                  <p><strong>BB:</strong> {modalData.bb_kg ?? '-'} kg</p>
                  <p><strong>TB:</strong> {modalData.tb_cm ?? '-'} cm</p>
                  <p><strong>LILA:</strong> {modalData.lila_cm ?? '-'} cm</p>
                  <p><strong>ZS-BBU:</strong> {modalData.zs_bbu ?? '-'}</p>
                  <p><strong>ZS-TBU:</strong> {modalData.zs_tbu ?? '-'}</p>
                  <p><strong>ZS-BBTB:</strong> {modalData.zs_bbtb ?? '-'}</p>
                </div>
              )}

              {modalData.type === 'Konsumsi' && (
                <div>
                  <p><strong>Kepatuhan:</strong> {modalData.kepatuhan_pct ?? '-'}%</p>
                  {modalData.catatan && <p><strong>Catatan:</strong> {modalData.catatan}</p>}
                </div>
              )}

              {modalData.type === 'Pemberian' && (
                <div>
                  <p><strong>Jumlah Unit:</strong> {modalData.jumlah_unit ?? '-'}</p>
                  <p><strong>Jenis Formulasi:</strong> {modalData.jenis_formulasi ?? '-'}</p>
                  {modalData.keterangan && <p><strong>Keterangan:</strong> {modalData.keterangan}</p>}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#4b5563',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .input{width:100%;border:1px solid #d1d5db;border-radius:.5rem;padding:.5rem .75rem;}
      `}</style>
    </div>
  );
}
