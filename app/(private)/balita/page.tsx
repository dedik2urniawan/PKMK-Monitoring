"use client";

import { useEffect, useState } from "react";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import BalitaActionsNew from "@/components/BalitaActionsNew";
import { Download, Filter, Search, Users } from "lucide-react";

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
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' });
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.split(" ").filter(p => p.length > 0);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function BalitaList() {
  const [kecList, setKecList] = useState<string[]>([]);
  const [pkmList, setPkmList] = useState<Pkm[]>([]);
  const [desaList, setDesaList] = useState<Desa[]>([]);

  const [kec, setKec] = useState("");
  const [puskesmasId, setPuskesmasId] = useState("");
  const [desa, setDesa] = useState("");
  const [nik, setNik] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
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
      ? ['nik', 'nama_balita', 'jk', 'tgl_lahir', 'kec', 'desa_kel', 'redflag_any']
      : ['nik', 'nama_balita', 'jk', 'tgl_lahir', 'bb_lahir_kg', 'tb_lahir_cm', 'nama_ortu', 'kab_kota', 'kec', 'desa_kel', 'posyandu', 'rt', 'rw', 'alamat', 'puskesmas_id', 'sumber_data', 'created_at', 'bb_tidak_adekuat', 'murmur_edema', 'delayed_development', 'wajah_dismorfik', 'organomegali_limfadenopati', 'ispa_cystitis', 'muntah_diare_berulang', 'diagnosa_penyakit_penyerta', 'keterangan_redflag', 'redflag_any'];
    const rows = items.map((d) => headers.map((h) => {
      const v = (d as any)[h];
      if (v == null) return '';
      const s = typeof v === 'string' ? v : (v instanceof Date ? v.toISOString() : String(v));
      return '"' + s.replaceAll('"', '""') + '"';
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
    if (createdFrom) params.set("created_from", createdFrom);
    if (createdTo) params.set("created_to", createdTo);
    if (sortOrder) params.set("sort_order", sortOrder);
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
    onSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  return (
    <>
      <style jsx>{`
        .page-container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 16px;
          padding-bottom: 100px; /* Safe space for BottomNav */
        }
        @media (min-width: 768px) {
          .page-container {
            padding: 32px;
          }
        }
        .page-header {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }
        @media (min-width: 768px) {
          .page-header {
            flex-direction: row;
            align-items: flex-end;
            justify-content: space-between;
          }
        }
        .page-title {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.025em;
        }
        .page-subtitle {
          color: #638884;
          font-size: 16px;
          margin-top: 4px;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }
        .checkbox-label input {
          width: 16px;
          height: 16px;
          accent-color: #14b8a6;
        }
        .checkbox-label span {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
        .btn-export {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #374151;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          transition: all 0.2s;
        }
        .btn-export:hover {
          background: #f8fafc;
        }
        .filter-section {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .filter-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .filter-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 1200px) {
          .filter-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .filter-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
        }
        .filter-select {
          width: 100%;
          height: 42px;
          padding: 0 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13.5px;
          color: #334155;
          background: white;
          cursor: pointer;
          box-sizing: border-box;
          transition: all 0.2s;
        }
        .filter-select:focus {
          outline: none;
          border-color: #14b8a6;
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
        }
        .filter-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .filter-input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          z-index: 2;
        }
        .filter-input {
          width: 100%;
          height: 42px;
          padding: 0 12px 0 38px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 13.5px;
          color: #334155;
          box-sizing: border-box;
          transition: all 0.2s;
        }
        .filter-input:focus {
          outline: none;
          border-color: #14b8a6;
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
        }
        .filter-input::placeholder {
          color: #94a3b8;
        }
        .btn-filter {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          height: 42px;
          padding: 0 16px;
          background: #14b8a6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
          box-sizing: border-box;
        }
        .btn-filter:hover {
          background: #0d9488;
        }
        .table-section {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .table-wrapper {
          overflow-x: auto;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .data-table thead {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .data-table th {
          padding: 16px 24px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
        }
        .data-table tbody tr {
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.15s;
        }
        .data-table tbody tr:hover {
          background: rgba(20, 184, 166, 0.03);
        }
        .data-table td {
          padding: 12px 24px;
          font-size: 14px;
          color: #475569;
        }
        .cell-nik {
          font-family: ui-monospace, monospace;
          font-size: 13px;
        }
        .cell-name {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .avatar.male {
          background: #dbeafe;
          color: #1d4ed8;
        }
        .avatar.female {
          background: #fce7f3;
          color: #be185d;
        }
        .name-text {
          font-weight: 600;
          color: #0f172a;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 500;
        }
        .badge.red {
          background: #fef2f2;
          color: #991b1b;
        }
        .badge.green {
          background: #f0fdf4;
          color: #166534;
        }
        .actions-cell {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          opacity: 0.6;
        }
        .data-table tbody tr:hover .actions-cell {
          opacity: 1;
        }
        .empty-state {
          padding: 48px 24px;
          text-align: center;
          color: #64748b;
        }
        .pagination-footer {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px 24px;
          border-top: 1px solid #e2e8f0;
          background: white;
        }
        @media (min-width: 768px) {
          .pagination-footer {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }
        .pagination-info {
          font-size: 14px;
          color: #64748b;
        }
        .pagination-info strong {
          color: #0f172a;
          font-weight: 600;
        }
        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .rows-per-page {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #64748b;
        }
        .rows-per-page select {
          padding: 6px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          background: #f8fafc;
        }
        .page-nav {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .page-btn {
          padding: 8px;
          border: none;
          background: none;
          border-radius: 6px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s;
        }
        .page-btn:hover:not(:disabled) {
          background: rgba(20, 184, 166, 0.1);
          color: #14b8a6;
        }
        .page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .page-input-group {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 8px;
        }
        .page-input {
          width: 48px;
          padding: 6px;
          text-align: center;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
        }
        .page-input:focus {
          outline: none;
          border-color: #14b8a6;
        }
        .page-total {
          font-size: 14px;
          color: #64748b;
        }
      `}</style>

      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Data Balita</h1>
            <p className="page-subtitle">Daftar lengkap balita terdaftar dalam program PKMK Kabupaten Malang</p>
          </div>
          <div className="header-actions">
            <label className="checkbox-label">
              <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} />
              <span>Tampilan ringkas</span>
            </label>
            <button type="button" onClick={exportCsv} className="btn-export">
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <form onSubmit={onSubmit} className="filter-section">
          <div className="filter-grid">
            <div className="filter-group">
              <label className="filter-label">Kecamatan</label>
              <select className="filter-select" value={kec} onChange={(e) => setKec(e.target.value)}>
                <option value="">Semua Kecamatan</option>
                {kecList.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Puskesmas</label>
              <select className="filter-select" value={puskesmasId} onChange={(e) => setPuskesmasId(e.target.value)}>
                <option value="">Semua Puskesmas</option>
                {pkmList.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Desa/Kel</label>
              <select className="filter-select" value={desa} onChange={(e) => setDesa(e.target.value)}>
                <option value="">Semua Desa</option>
                {desaList.map((d) => (
                  <option key={d.id} value={d.desa_kel}>{d.desa_kel}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Pencarian NIK / Nama</label>
              <div className="filter-input-wrapper">
                <Search size={16} className="filter-input-icon" />
                <input
                  className="filter-input"
                  placeholder="Cari NIK atau Nama..."
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">Tgl Terdaftar (Mulai)</label>
              <input
                type="date"
                className="filter-select"
                value={createdFrom}
                onChange={(e) => setCreatedFrom(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Tgl Terdaftar (Selesai)</label>
              <input
                type="date"
                className="filter-select"
                value={createdTo}
                onChange={(e) => setCreatedTo(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">Urutkan Data</label>
              <select className="filter-select" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="newest">📅 Terdaftar Terbaru</option>
                <option value="oldest">⌛ Terdaftar Terlama</option>
                <option value="nama">🔤 Nama (A-Z)</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label" style={{ opacity: 0, userSelect: 'none' }}>Aksi</label>
              <button type="submit" className="btn-filter">
                <Filter size={16} />
                Filter Data
              </button>
            </div>
          </div>
        </form>

        {/* Data Table Section */}
        <section className="table-section">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                {compact ? (
                  <tr>
                    <th>NIK</th>
                    <th>Nama Balita</th>
                    <th>JK</th>
                    <th>Tgl Lahir</th>
                    <th>Kecamatan</th>
                    <th>Desa/Kel</th>
                    <th>Tgl Terdaftar</th>
                    <th style={{ textAlign: 'center' }}>Redflag?</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                ) : (
                  <tr>
                    <th>NIK</th>
                    <th>Nama</th>
                    <th>JK</th>
                    <th>Tgl Lahir</th>
                    <th>BB (kg)</th>
                    <th>TB (cm)</th>
                    <th>Ortu</th>
                    <th>Kec</th>
                    <th>Desa</th>
                    <th>Posyandu</th>
                    <th>Alamat</th>
                    <th>Sumber</th>
                    <th>Tgl Terdaftar</th>
                    <th style={{ textAlign: 'center' }}>Redflag?</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {items.map((d) => (
                  <tr key={d.id}>
                    {compact ? (
                      <>
                        <td className="cell-nik">{d.nik ?? "-"}</td>
                        <td>
                          <div className="cell-name">
                            <div className={`avatar ${d.jk === 'P' ? 'female' : 'male'}`}>
                              {getInitials(d.nama_balita)}
                            </div>
                            <span className="name-text">{d.nama_balita ?? "-"}</span>
                          </div>
                        </td>
                        <td>{d.jk ?? "-"}</td>
                        <td>{formatTanggal(d.tgl_lahir)}</td>
                        <td>{d.kec ?? "-"}</td>
                        <td>{d.desa_kel ?? "-"}</td>
                        <td>
                          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                            {formatTanggal(d.created_at)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${d.redflag_any ? 'red' : 'green'}`}>
                            {d.redflag_any ? 'Ya' : 'Tidak'}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <BalitaActionsNew
                              balita={d}
                              onDeleted={() => setItems((prev) => prev.filter((x) => x.id !== d.id))}
                              onUpdated={() => onSubmit()}
                            />
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="cell-nik">{d.nik ?? "-"}</td>
                        <td>
                          <div className="cell-name">
                            <div className={`avatar ${d.jk === 'P' ? 'female' : 'male'}`}>
                              {getInitials(d.nama_balita)}
                            </div>
                            <span className="name-text">{d.nama_balita ?? "-"}</span>
                          </div>
                        </td>
                        <td>{d.jk ?? "-"}</td>
                        <td>{formatTanggal(d.tgl_lahir)}</td>
                        <td>{d.bb_lahir_kg ?? "-"}</td>
                        <td>{d.tb_lahir_cm ?? "-"}</td>
                        <td>{d.nama_ortu ?? "-"}</td>
                        <td>{d.kec ?? "-"}</td>
                        <td>{d.desa_kel ?? "-"}</td>
                        <td>{d.posyandu ?? "-"}</td>
                        <td>{d.alamat ?? "-"}</td>
                        <td>{d.sumber_data ?? "-"}</td>
                        <td>
                          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                            {formatTanggal(d.created_at)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${d.redflag_any ? 'red' : 'green'}`}>
                            {d.redflag_any ? 'Ya' : 'Tidak'}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <BalitaActionsNew
                              balita={d}
                              onDeleted={() => setItems((prev) => prev.filter((x) => x.id !== d.id))}
                              onUpdated={() => onSubmit()}
                            />
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={compact ? 8 : 14} className="empty-state">
                      <Users size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                      <p>Tidak ada data balita.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="pagination-footer">
            <div className="pagination-info">
              Menampilkan <strong>{items.length}</strong> dari <strong>{total.toLocaleString()}</strong> data
            </div>
            <div className="pagination-controls">
              <div className="rows-per-page">
                <span>Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="page-nav">
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                  title="First"
                >
                  ⏮
                </button>
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  title="Previous"
                >
                  ◀
                </button>
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
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page >= pages}
                  title="Next"
                >
                  ▶
                </button>
                <button
                  type="button"
                  className="page-btn"
                  onClick={() => setPage(pages)}
                  disabled={page >= pages}
                  title="Last"
                >
                  ⏭
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
