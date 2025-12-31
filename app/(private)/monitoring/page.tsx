"use client";
import { X, Ruler, UtensilsCrossed, HandHeart, Filter, Search, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import Link from "next/link";

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
  const colorMap: Record<string, string> = {
    'bg-blue-500': '#3b82f6',
    'bg-emerald-500': '#10b981',
    'bg-purple-500': '#a855f7',
    'bg-gray-200': '#e5e7eb'
  };

  return (
    <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
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
            style={{ padding: '2px', cursor: active ? 'pointer' : 'default' }}
            title={`Minggu ${w}: ${active ? "Sudah (klik untuk detail)" : "Belum"}`}
          >
            <div
              style={{
                width: '10px',
                height: '16px',
                borderRadius: '2px',
                backgroundColor: active ? (colorMap[color] || colorMap['bg-gray-200']) : colorMap['bg-gray-200'],
                transition: 'opacity 0.15s'
              }}
              className={active ? 'hover:opacity-75' : ''}
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
  const [authReady, setAuthReady] = useState(false);

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
      // Mark auth as ready after first successful auth call
      setAuthReady(true);
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

  useEffect(() => {
    if (!authReady) return; // Wait for auth to be ready
    onSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, authReady]);

  useEffect(() => { setPageInput(String(page)); }, [page]);

  return (
    <>
      <style jsx>{`
        .page-container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 32px;
        }
        .page-header {
          margin-bottom: 24px;
        }
        .page-title {
          font-size: 28px;
          font-weight: 900;
          color: #111817;
          letter-spacing: -0.033em;
        }
        .page-subtitle {
          color: #638884;
          font-size: 15px;
          margin-top: 8px;
          max-width: 800px;
          line-height: 1.5;
        }
        .filter-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .filter-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .filter-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .filter-grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .filter-label {
          font-size: 14px;
          font-weight: 600;
          color: #111817;
        }
        .filter-input {
          width: 100%;
          height: 48px;
          padding: 0 16px;
          border: 1px solid #dce5e4;
          border-radius: 8px;
          font-size: 14px;
          color: #111817;
          background: white;
        }
        .filter-input:focus {
          outline: none;
          border-color: #14b8a6;
          box-shadow: 0 0 0 2px rgba(20,184,166,0.1);
        }
        .filter-btn {
          height: 48px;
          width: 100%;
          background: #14b8a6;
          color: #111817;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s;
        }
        .filter-btn:hover {
          background: #0d9488;
        }
        .legend-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 20px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .legend-items {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }
        .legend-title {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          margin-right: 8px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }
        .legend-dot.blue { background: #3b82f6; }
        .legend-dot.green { background: #10b981; }
        .legend-dot.purple { background: #a855f7; }
        .legend-dot.gray { background: #e5e7eb; }
        .legend-text {
          font-size: 14px;
          font-weight: 500;
          color: #111817;
        }
        .legend-text.muted { color: #6b7280; }
        .legend-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #638884;
        }
        .table-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .table-wrapper {
          overflow-x: auto;
        }
        .data-table {
          width: 100%;
          min-width: 1200px;
          border-collapse: collapse;
        }
        .data-table thead {
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        .data-table th {
          padding: 16px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6b7280;
        }
        .data-table th.center { text-align: center; }
        .data-table th .sub {
          display: block;
          font-size: 10px;
          font-weight: 400;
          color: #9ca3af;
          text-transform: none;
          letter-spacing: normal;
          margin-top: 2px;
        }
        .data-table tbody tr {
          border-bottom: 1px solid #f0f4f4;
          transition: background 0.15s;
        }
        .data-table tbody tr:hover {
          background: rgba(20,184,166,0.03);
        }
        .data-table td {
          padding: 16px;
          font-size: 14px;
          color: #374151;
        }
        .cell-nik {
          font-family: ui-monospace, monospace;
          font-size: 13px;
          color: #6b7280;
        }
        .cell-name {
          font-weight: 700;
          color: #111817;
        }
        .cell-age {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 2px;
        }
        .actions-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 8px;
          transition: background 0.15s;
          text-decoration: none;
        }
        .action-btn.blue {
          background: #eff6ff;
          color: #2563eb;
        }
        .action-btn.blue:hover { background: #dbeafe; }
        .action-btn.green {
          background: #ecfdf5;
          color: #059669;
        }
        .action-btn.green:hover { background: #d1fae5; }
        .action-btn.purple {
          background: #faf5ff;
          color: #9333ea;
        }
        .action-btn.purple:hover { background: #f3e8ff; }
        .empty-state {
          text-align: center;
          padding: 48px 16px;
          color: #6b7280;
        }
        .pagination-footer {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px 20px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }
        @media (min-width: 640px) {
          .pagination-footer {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }
        .pagination-info {
          font-size: 14px;
          color: #6b7280;
        }
        .pagination-info strong {
          color: #111817;
          font-weight: 700;
        }
        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .rows-select {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #6b7280;
        }
        .rows-select select {
          height: 32px;
          padding: 0 8px;
          border: 1px solid #dce5e4;
          border-radius: 6px;
          font-size: 14px;
          background: white;
        }
        .page-nav {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .page-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #dce5e4;
          border-radius: 6px;
          background: white;
          color: #6b7280;
          cursor: pointer;
          transition: background 0.15s;
          font-size: 14px;
        }
        .page-btn:hover:not(:disabled) {
          background: #f3f4f6;
        }
        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .page-input-group {
          display: flex;
          align-items: center;
          gap: 6px;
          margin: 0 4px;
        }
        .page-input {
          width: 40px;
          height: 32px;
          text-align: center;
          border: 1px solid #dce5e4;
          border-radius: 6px;
          font-size: 14px;
        }
        .page-input:focus {
          outline: none;
          border-color: #14b8a6;
        }
        .page-total {
          font-size: 14px;
          color: #6b7280;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,0.75);
          backdrop-filter: blur(4px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-content {
          background: white;
          border-radius: 20px;
          max-width: 480px;
          width: 100%;
          max-height: 85vh;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          animation: modalSlideIn 0.2s ease-out;
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-header {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .modal-header.type-antropometri {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }
        .modal-header.type-konsumsi {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
        }
        .modal-header.type-pemberian {
          background: linear-gradient(135deg, #10b981, #059669);
        }
        .modal-header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .modal-icon {
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-title {
          font-size: 18px;
          font-weight: 700;
          color: white;
          margin: 0;
        }
        .modal-subtitle {
          font-size: 13px;
          color: rgba(255,255,255,0.85);
          margin-top: 2px;
        }
        .modal-close-x {
          width: 32px;
          height: 32px;
          background: rgba(255,255,255,0.15);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: background 0.15s;
        }
        .modal-close-x:hover {
          background: rgba(255,255,255,0.25);
        }
        .modal-body {
          padding: 24px;
        }
        .modal-data-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .modal-data-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 16px;
        }
        .modal-data-item.full-width {
          grid-column: span 2;
        }
        .modal-data-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .modal-data-value {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
        }
        .modal-data-value.small {
          font-size: 14px;
          font-weight: 500;
        }
        .modal-data-value.positive {
          color: #10b981;
        }
        .modal-data-value.negative {
          color: #ef4444;
        }
        .modal-data-value.warning {
          color: #f59e0b;
        }
        .modal-footer {
          padding: 16px 24px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
        .modal-close-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #475569, #334155);
          color: white;
          border-radius: 10px;
          border: none;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .modal-close-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
      `}</style>

      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Monitoring PKMK</h1>
          <p className="page-subtitle">
            Pantau perkembangan antropometri, konsumsi, dan pemberian PKMK (Pangan Olahan untuk Keperluan Medis Khusus) pada balita stunting selama 12 minggu pemantauan.
          </p>
        </div>

        {/* Filter Section */}
        <form onSubmit={onSubmit} className="filter-section">
          <div className="filter-grid">
            <div className="filter-group">
              <label className="filter-label">Kecamatan</label>
              <select className="filter-input" value={kec} onChange={(e) => setKec(e.target.value)}>
                <option value="">Semua Kecamatan</option>
                {kecList.map((k) => (<option key={k} value={k}>{k}</option>))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Puskesmas</label>
              <select className="filter-input" value={puskesmasId} onChange={(e) => setPuskesmasId(e.target.value)}>
                <option value="">Semua Puskesmas</option>
                {pkmList.map((p) => (<option key={p.id} value={p.id}>{p.nama}</option>))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Desa / Kelurahan</label>
              <select className="filter-input" value={desa} onChange={(e) => setDesa(e.target.value)}>
                <option value="">Semua Desa</option>
                {desaList.map((d) => (<option key={d.id} value={d.desa_kel}>{d.desa_kel}</option>))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Cari NIK</label>
              <input className="filter-input" placeholder="Masukkan NIK Balita" value={nik} onChange={(e) => setNik(e.target.value)} />
            </div>
            <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
              <button type="submit" className="filter-btn">
                <Filter size={18} />
                Filter Data
              </button>
            </div>
          </div>
        </form>

        {/* Legend Bar */}
        <div className="legend-section">
          <div className="legend-items">
            <span className="legend-title">Indikator:</span>
            <div className="legend-item">
              <div className="legend-dot blue" />
              <span className="legend-text">Antropometri</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot green" />
              <span className="legend-text">Konsumsi</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot purple" />
              <span className="legend-text">Pemberian</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot gray" />
              <span className="legend-text muted">Belum Diisi</span>
            </div>
          </div>
          <div className="legend-hint">
            <Info size={16} />
            <span>Klik pada kotak indikator untuk melihat detail mingguan.</span>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-section">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 140 }}>NIK</th>
                  <th style={{ minWidth: 160 }}>Nama Balita</th>
                  <th>Desa/Kel</th>
                  <th className="center" style={{ width: 180 }}>Antropometri<span className="sub">(Minggu 1-12)</span></th>
                  <th className="center" style={{ width: 180 }}>Konsumsi<span className="sub">(Minggu 1-12)</span></th>
                  <th className="center" style={{ width: 180 }}>Pemberian<span className="sub">(Minggu 1-12)</span></th>
                  <th className="center" style={{ width: 160 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b: any) => {
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
                    <tr key={b.id}>
                      <td className="cell-nik">{b.nik ?? "-"}</td>
                      <td>
                        <div className="cell-name">{b.nama_balita}</div>
                      </td>
                      <td>{b.desa_kel ?? "-"}</td>
                      <td>
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
                      </td>
                      <td>
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
                      </td>
                      <td>
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
                      </td>
                      <td>
                        <div className="actions-cell">
                          <Link className="action-btn blue" href={`/monitoring/${b.id}/antropometri/new`} title="Input Antropometri">
                            <Ruler size={18} />
                          </Link>
                          <Link className="action-btn green" href={`/monitoring/${b.id}/konsumsi/new`} title="Input Konsumsi">
                            <UtensilsCrossed size={18} />
                          </Link>
                          <Link className="action-btn purple" href={`/monitoring/${b.id}/pemberian/new`} title="Input Pemberian">
                            <HandHeart size={18} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      Belum ada data hasil filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="pagination-footer">
            <p className="pagination-info">
              Menampilkan <strong>{items.length}</strong> dari <strong>{total}</strong> data
            </p>
            <div className="pagination-controls">
              <div className="rows-select">
                <span>Rows per page:</span>
                <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="page-nav">
                <button type="button" className="page-btn" onClick={() => setPage(1)} disabled={page <= 1}>⏮</button>
                <button type="button" className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>◀</button>
                <div className="page-input-group">
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
                    className="page-input"
                  />
                  <span className="page-total">of {pages}</span>
                </div>
                <button type="button" className="page-btn" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>▶</button>
                <button type="button" className="page-btn" onClick={() => setPage(pages)} disabled={page >= pages}>⏭</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Weekly Details - Stitch Style */}
      {modalOpen && modalData && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-header ${modalData.type === 'Antropometri' ? 'type-antropometri' : modalData.type === 'Konsumsi' ? 'type-konsumsi' : 'type-pemberian'}`}>
              <div className="modal-header-content">
                <div className="modal-icon">
                  {modalData.type === 'Antropometri' && <Ruler size={22} color="white" />}
                  {modalData.type === 'Konsumsi' && <UtensilsCrossed size={22} color="white" />}
                  {modalData.type === 'Pemberian' && <HandHeart size={22} color="white" />}
                </div>
                <div>
                  <h2 className="modal-title">Detail {modalData.type}</h2>
                  <p className="modal-subtitle">
                    {modalData.balitaName} • Minggu {modalData.week}
                    {modalData.tanggal && ` • ${new Date(modalData.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                  </p>
                </div>
              </div>
              <button className="modal-close-x" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {modalData.type === 'Antropometri' && (
                <div className="modal-data-grid">
                  <div className="modal-data-item">
                    <div className="modal-data-label">Berat Badan</div>
                    <div className="modal-data-value">{modalData.bb_kg ?? '-'} <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>kg</span></div>
                  </div>
                  <div className="modal-data-item">
                    <div className="modal-data-label">Tinggi Badan</div>
                    <div className="modal-data-value">{modalData.tb_cm ?? '-'} <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>cm</span></div>
                  </div>
                  <div className="modal-data-item">
                    <div className="modal-data-label">LILA</div>
                    <div className="modal-data-value">{modalData.lila_cm ?? '-'} <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>cm</span></div>
                  </div>
                  <div className="modal-data-item">
                    <div className="modal-data-label">Z-Score BBU</div>
                    <div className={`modal-data-value ${(modalData.zs_bbu ?? 0) < -2 ? 'negative' : (modalData.zs_bbu ?? 0) < -1 ? 'warning' : ''}`}>{modalData.zs_bbu ?? '-'}</div>
                  </div>
                  <div className="modal-data-item">
                    <div className="modal-data-label">Z-Score TBU</div>
                    <div className={`modal-data-value ${(modalData.zs_tbu ?? 0) < -2 ? 'negative' : (modalData.zs_tbu ?? 0) < -1 ? 'warning' : ''}`}>{modalData.zs_tbu ?? '-'}</div>
                  </div>
                  <div className="modal-data-item">
                    <div className="modal-data-label">Z-Score BBTB</div>
                    <div className={`modal-data-value ${(modalData.zs_bbtb ?? 0) < -2 ? 'negative' : (modalData.zs_bbtb ?? 0) < -1 ? 'warning' : ''}`}>{modalData.zs_bbtb ?? '-'}</div>
                  </div>
                </div>
              )}
              {modalData.type === 'Konsumsi' && (
                <div className="modal-data-grid">
                  <div className="modal-data-item full-width">
                    <div className="modal-data-label">Tingkat Kepatuhan</div>
                    <div className={`modal-data-value ${(modalData.kepatuhan_pct ?? 0) >= 80 ? 'positive' : (modalData.kepatuhan_pct ?? 0) >= 50 ? 'warning' : 'negative'}`}>
                      {modalData.kepatuhan_pct ?? '-'}%
                    </div>
                  </div>
                  {modalData.catatan && (
                    <div className="modal-data-item full-width">
                      <div className="modal-data-label">Catatan</div>
                      <div className="modal-data-value small">{modalData.catatan}</div>
                    </div>
                  )}
                </div>
              )}
              {modalData.type === 'Pemberian' && (
                <div className="modal-data-grid">
                  <div className="modal-data-item">
                    <div className="modal-data-label">Jumlah Unit</div>
                    <div className="modal-data-value positive">{modalData.jumlah_unit ?? '-'}</div>
                  </div>
                  <div className="modal-data-item">
                    <div className="modal-data-label">Jenis Formulasi</div>
                    <div className="modal-data-value small">{modalData.jenis_formulasi ?? '-'}</div>
                  </div>
                  {modalData.keterangan && (
                    <div className="modal-data-item full-width">
                      <div className="modal-data-label">Keterangan</div>
                      <div className="modal-data-value small">{modalData.keterangan}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setModalOpen(false)} className="modal-close-btn">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
