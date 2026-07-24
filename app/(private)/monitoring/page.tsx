"use client";
import { X, Ruler, UtensilsCrossed, HandHeart, Filter, Search, Info, CheckCircle2, Award, AlertCircle, Sparkles, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { ensureServerSession, getAuthHeaders } from "@/lib/clientSession";
import Link from "next/link";

type Balita = { id: string; nik: string | null; nama_balita: string; desa_kel: string | null; puskesmas_id: string; kohort?: any[] };
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

  // Filter state
  const [kecList, setKecList] = useState<string[]>([]);
  const [pkmList, setPkmList] = useState<Pkm[]>([]);
  const [desaList, setDesaList] = useState<Desa[]>([]);

  const [kec, setKec] = useState("");
  const [puskesmasId, setPuskesmasId] = useState("");
  const [desa, setDesa] = useState("");
  const [nik, setNik] = useState("");
  const [siklus, setSiklus] = useState(""); // "" = Semua Siklus, "1", "2", ... "6"

  const [items, setItems] = useState<Balita[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [pageInput, setPageInput] = useState("1");
  const [authReady, setAuthReady] = useState(false);

  // Modals for Finish Action (Selesai Intervensi)
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [finishModalData, setFinishModalData] = useState<any>(null);
  const [completionDate, setCompletionDate] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [submittingFinish, setSubmittingFinish] = useState(false);

  // Modal for Unqualified Progress Breakdown
  const [unqualifiedModalOpen, setUnqualifiedModalOpen] = useState(false);
  const [unqualifiedData, setUnqualifiedData] = useState<any>(null);

  // Modal for Completed Cohort Details
  const [completedDetailModalOpen, setCompletedDetailModalOpen] = useState(false);
  const [completedDetailData, setCompletedDetailData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        await ensureServerSession();
        const authHeaders = await getAuthHeaders();
        const res = await fetch("/api/ref/kecamatan", { credentials: 'include', headers: authHeaders });
        if (!res.ok) {
          console.warn("[/api/ref/kecamatan] non-OK response:", res.status);
          setAuthReady(true);
          return;
        }
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        const items: string[] = data.items || [];
        setKecList(items);
        if (items.length === 1) {
          setKec((prev) => prev || items[0]);
        }
      } catch (err) {
        console.error("Error fetching kecamatan:", err);
      } finally {
        setAuthReady(true);
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
      try {
        await ensureServerSession();
        const authHeaders = await getAuthHeaders();
        const rp = await fetch(`/api/ref/puskesmas?kecamatan=${encodeURIComponent(kec)}`, { credentials: 'include', headers: authHeaders });
        if (!rp.ok) return;
        const text = await rp.text();
        const p = text ? JSON.parse(text) : {};
        const mapped = (p.items || []).map((r: any) => ({ id: r.id, nama: r.nama }));
        setPkmList(mapped);
        setDesaList([]);
        setDesa("");
        setPuskesmasId(mapped.length === 1 ? mapped[0].id : "");
      } catch (err) {
        console.error("Error fetching puskesmas:", err);
      }
    })();
  }, [kec]);

  useEffect(() => {
    if (!puskesmasId) return;
    (async () => {
      try {
        await ensureServerSession();
        const authHeaders = await getAuthHeaders();
        const rd = await fetch(`/api/ref/desa?puskesmas_id=${encodeURIComponent(puskesmasId)}`, { credentials: 'include', headers: authHeaders });
        if (!rd.ok) return;
        const text = await rd.text();
        const d = text ? JSON.parse(text) : {};
        const mapped = (d.items || []).map((r: any) => ({ id: r.id, desa_kel: r.desa_kel }));
        setDesaList(mapped);
        if (mapped.length === 1) {
          setDesa((prev) => prev || mapped[0].desa_kel);
        }
      } catch (err) {
        console.error("Error fetching desa:", err);
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
    if (siklus) params.set("siklus", siklus);
    params.set('page', String(e ? 1 : page));
    params.set('limit', String(limit));
    try {
      await ensureServerSession();
      const authHeaders = await getAuthHeaders();
      const res = await fetch(`/api/monitoring/balita?${params.toString()}`, { credentials: 'include', headers: authHeaders });
      if (!res.ok) return;
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      setItems(data.items || []);
      setPages(data.pages || 1);
      setTotal(data.total || (data.items?.length ?? 0));
    } catch (err) {
      console.error("Error fetching monitoring balita:", err);
    }
  }

  useEffect(() => {
    if (!authReady) return;
    onSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, authReady]);

  useEffect(() => { setPageInput(String(page)); }, [page]);

  // Handler for 4th Action Icon (CheckCircle2 / Tandai Selesai)
  const handleFinishActionClick = (b: any, targetCohort: any, antroCount: number, konsumsiCount: number, pemberianCount: number, cycleNum: number) => {
    if (!targetCohort) {
      alert("Balita ini belum terdaftar pada Kohort Intervensi PKMK.");
      return;
    }

    const isQualified = antroCount >= 10 && konsumsiCount >= 10 && pemberianCount >= 10;
    const isCompleted = targetCohort.status === "selesai";

    if (isCompleted) {
      // Case C: Cohort Already Completed -> Open Detail Modal
      setCompletedDetailData({
        balitaName: b.nama_balita,
        nik: b.nik,
        desa: b.desa_kel,
        cycleNum,
        cohort: targetCohort,
        antroCount,
        konsumsiCount,
        pemberianCount,
      });
      setCompletedDetailModalOpen(true);
    } else if (!isQualified) {
      // Case A: Qualification Not Met -> Open Professional Explanation Modal
      setUnqualifiedData({
        balitaName: b.nama_balita,
        nik: b.nik,
        desa: b.desa_kel,
        cycleNum,
        antroCount,
        konsumsiCount,
        pemberianCount,
      });
      setUnqualifiedModalOpen(true);
    } else {
      // Case B: Qualification Met -> Open Confirmation & AI Summary Modal
      setFinishModalData({
        balitaName: b.nama_balita,
        nik: b.nik,
        desa: b.desa_kel,
        cycleNum,
        cohort: targetCohort,
        antroCount,
        konsumsiCount,
        pemberianCount,
      });
      setCompletionDate(new Date().toISOString().split('T')[0]);
      setCompletionNotes("");
      setFinishModalOpen(true);
    }
  };

  // Submit Handler for Confirming Selesai Intervensi
  const handleConfirmFinish = async () => {
    if (!finishModalData?.cohort?.id) return;
    setSubmittingFinish(true);
    try {
      await ensureServerSession();
      const authHeaders = await getAuthHeaders();
      const res = await fetch("/api/kohort/selesai", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        credentials: "include",
        body: JSON.stringify({
          kohort_id: finishModalData.cohort.id,
          tgl_selesai: completionDate,
          catatan: completionNotes,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        alert("Gagal menandai selesai: " + errText);
        setSubmittingFinish(false);
        return;
      }

      alert(`🎉 Intervensi Kohort (Siklus ${finishModalData.cycleNum}) berhasil ditandai Selesai!`);
      setFinishModalOpen(false);
      setFinishModalData(null);
      await onSubmit(); // refresh list
    } catch (err: any) {
      alert("Terjadi kesalahan: " + (err.message || "Gagal memproses request"));
    } finally {
      setSubmittingFinish(false);
    }
  };

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
        @media (min-width: 640px) {
          .filter-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .filter-grid {
            grid-template-columns: repeat(6, 1fr);
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
        .filter-input {
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
        .filter-input:focus {
          outline: none;
          border-color: #14b8a6;
          box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
        }
        .filter-btn {
          height: 42px;
          width: 100%;
          background: #14b8a6;
          color: white;
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
          box-sizing: border-box;
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
          min-width: 1280px;
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
        .actions-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          box-sizing: border-box;
        }
        .action-btn.blue {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }
        .action-btn.blue:hover { background: #dbeafe; }
        .action-btn.green {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }
        .action-btn.green:hover { background: #d1fae5; }
        .action-btn.purple {
          background: #faf5ff;
          color: #9333ea;
          border: 1px solid #e9d5ff;
        }
        .action-btn.purple:hover { background: #f3e8ff; }

        /* 4th Action Button Styling */
        .action-btn.slate-default {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #cbd5e1;
        }
        .action-btn.slate-default:hover {
          background: #e2e8f0;
          color: #334155;
        }
        .action-btn.emerald-qualified {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #6ee7b7;
          animation: pulseEmerald 2s infinite;
        }
        @keyframes pulseEmerald {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .action-btn.emerald-completed {
          background: #10b981;
          color: white;
          border: 1px solid #059669;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
        }

        .badge-siklus {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }
        .badge-siklus.berjalan {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }
        .badge-siklus.selesai {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }
        .badge-siklus.belum {
          background: #f3f4f6;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }

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

        /* Modal Styles */
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
          max-width: 520px;
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
        .modal-header.type-unqualified {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }
        .modal-header.type-finish {
          background: linear-gradient(135deg, #10b981, #047857);
        }
        .modal-header.type-completed {
          background: linear-gradient(135deg, #059669, #064e3b);
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
          max-height: 60vh;
          overflow-y: auto;
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
        .modal-confirm-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border-radius: 10px;
          border: none;
          font-weight: 700;
          font-size: 14.5px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          transition: all 0.15s;
        }
        .modal-confirm-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
        }
        .modal-confirm-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      <div className="page-container">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Monitoring PKMK</h1>
          <p className="page-subtitle">
            Pantau perkembangan antropometri, konsumsi, dan pemberian PKMK (Pangan Olahan untuk Keperluan Medis Khusus) pada balita stunting selama 12 minggu pemantauan per siklus.
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
            <div className="filter-group">
              <label className="filter-label">Siklus PKMK</label>
              <select className="filter-input" value={siklus} onChange={(e) => setSiklus(e.target.value)}>
                <option value="">Semua Siklus</option>
                <option value="1">Siklus 1 (Minggu 1-12)</option>
                <option value="2">Siklus 2 (Minggu 1-12)</option>
                <option value="3">Siklus 3 (Minggu 1-12)</option>
                <option value="4">Siklus 4 (Minggu 1-12)</option>
                <option value="5">Siklus 5 (Minggu 1-12)</option>
                <option value="6">Siklus 6 (Minggu 1-12)</option>
              </select>
            </div>
            <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
              <label className="filter-label" style={{ opacity: 0, userSelect: 'none' }}>Aksi</label>
              <button type="submit" className="filter-btn">
                <Filter size={16} />
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
            <span>Klik pada kotak indikator untuk detail, atau gunakan tombol centang untuk Selesai Intervensi (min. 10 minggu).</span>
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
                  <th className="center" style={{ width: 110 }}>Siklus PKMK</th>
                  <th className="center" style={{ width: 180 }}>Antropometri<span className="sub">(Minggu 1-12)</span></th>
                  <th className="center" style={{ width: 180 }}>Konsumsi<span className="sub">(Minggu 1-12)</span></th>
                  <th className="center" style={{ width: 180 }}>Pemberian<span className="sub">(Minggu 1-12)</span></th>
                  <th className="center" style={{ width: 180 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b: any) => {
                  const cohorts = [...(b.kohort || [])].sort((c1: any, c2: any) =>
                    new Date(c1.periode_mulai || c1.created_at).getTime() - new Date(c2.periode_mulai || c2.created_at).getTime()
                  );

                  let targetCohortIndex = cohorts.length > 0 ? cohorts.length - 1 : -1;
                  if (siklus) {
                    const reqSiklusIndex = Number(siklus) - 1;
                    if (reqSiklusIndex >= 0 && reqSiklusIndex < cohorts.length) {
                      targetCohortIndex = reqSiklusIndex;
                    } else {
                      targetCohortIndex = -1;
                    }
                  }

                  const targetCohort = targetCohortIndex >= 0 ? cohorts[targetCohortIndex] : null;
                  const cycleNum = targetCohortIndex >= 0 ? targetCohortIndex + 1 : (siklus ? Number(siklus) : 1);

                  const antroWeeks: number[] = targetCohort
                    ? Array.from(new Set((targetCohort.monitoring_antropometri || []).map((m: any) => Number(m.minggu_ke)).filter((w: number) => !isNaN(w))))
                    : [];
                  const konsumsiWeeks: number[] = targetCohort
                    ? Array.from(new Set((targetCohort.monitoring_pkmk_konsumsi || []).map((m: any) => Number(m.minggu_ke)).filter((w: number) => !isNaN(w))))
                    : [];
                  const pemberianWeeks: number[] = targetCohort
                    ? Array.from(new Set((targetCohort.monitoring_pkmk_pemberian || []).map((m: any) => Number(m.minggu_ke)).filter((w: number) => !isNaN(w))))
                    : [];

                  const isQualified = antroWeeks.length >= 10 && konsumsiWeeks.length >= 10 && pemberianWeeks.length >= 10;
                  const isCompleted = targetCohort?.status === "selesai";

                  return (
                    <tr key={b.id}>
                      <td className="cell-nik">{b.nik ?? "-"}</td>
                      <td>
                        <div className="cell-name">{b.nama_balita}</div>
                      </td>
                      <td>{b.desa_kel ?? "-"}</td>
                      <td style={{ textAlign: 'center' }}>
                        {targetCohort ? (
                          <span className={`badge-siklus ${isCompleted ? 'selesai' : 'berjalan'}`}>
                            {isCompleted ? '✓' : '⏱️'} Siklus {cycleNum}
                          </span>
                        ) : (
                          <span className="badge-siklus belum">-</span>
                        )}
                      </td>
                      <td>
                        <HistoryCell
                          weeks={antroWeeks}
                          color="bg-blue-500"
                          onWeekClick={(week) => {
                            const data = (targetCohort?.monitoring_antropometri || []).find((m: any) => Number(m.minggu_ke) === week);
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
                            const data = (targetCohort?.monitoring_pkmk_konsumsi || []).find((m: any) => Number(m.minggu_ke) === week);
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
                            const data = (targetCohort?.monitoring_pkmk_pemberian || []).find((m: any) => Number(m.minggu_ke) === week);
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

                          {/* 4th Action Icon: Tandai / Detail Selesai Intervensi (DEFAULT ALWAYS VISIBLE) */}
                          <button
                            type="button"
                            onClick={() => handleFinishActionClick(b, targetCohort, antroWeeks.length, konsumsiWeeks.length, pemberianWeeks.length, cycleNum)}
                            className={`action-btn ${isCompleted ? 'emerald-completed' : isQualified ? 'emerald-qualified' : 'slate-default'}`}
                            title={
                              isCompleted
                                ? `✓ Intervensi Siklus ${cycleNum} Selesai (Klik untuk lihat detail)`
                                : isQualified
                                ? `✅ Memenuhi Syarat (≥10 Minggu) - Klik Tandai Selesai`
                                : `ℹ️ Status Selesai Intervensi (Klik untuk cek progress kriteria)`
                            }
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-state">
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

      {/* Modal 1: Weekly Details */}
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

      {/* Modal 2: Unqualified Progress Breakdown (Case A) */}
      {unqualifiedModalOpen && unqualifiedData && (
        <div className="modal-overlay" onClick={() => setUnqualifiedModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header type-unqualified">
              <div className="modal-header-content">
                <div className="modal-icon">
                  <AlertCircle size={22} color="white" />
                </div>
                <div>
                  <h2 className="modal-title">Belum Memenuhi Kriteria</h2>
                  <p className="modal-subtitle">
                    {unqualifiedData.balitaName} • Siklus {unqualifiedData.cycleNum}
                  </p>
                </div>
              </div>
              <button className="modal-close-x" onClick={() => setUnqualifiedModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: 14, borderRadius: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5, margin: 0 }}>
                  <strong>Informasi Kriteria Intervensi:</strong> Sesuai protokol klinis PKMK, intervensi 12 minggu memerlukan pemantauan minimal <strong>10 minggu</strong> pada setiap indikator sebelum dapat ditandai <em>Selesai Intervensi</em>.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Antropometri Progress */}
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>📏 Antropometri</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: unqualifiedData.antroCount >= 10 ? '#059669' : '#d97706' }}>
                      {unqualifiedData.antroCount} / 10 Minggu {unqualifiedData.antroCount >= 10 ? '✓' : `(Kurang ${10 - unqualifiedData.antroCount})`}
                    </span>
                  </div>
                  <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (unqualifiedData.antroCount / 10) * 100)}%`, height: '100%', background: unqualifiedData.antroCount >= 10 ? '#10b981' : '#f59e0b', transition: 'width 0.3s' }} />
                  </div>
                </div>

                {/* Konsumsi Progress */}
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>🍱 Konsumsi PKMK</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: unqualifiedData.konsumsiCount >= 10 ? '#059669' : '#d97706' }}>
                      {unqualifiedData.konsumsiCount} / 10 Minggu {unqualifiedData.konsumsiCount >= 10 ? '✓' : `(Kurang ${10 - unqualifiedData.konsumsiCount})`}
                    </span>
                  </div>
                  <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (unqualifiedData.konsumsiCount / 10) * 100)}%`, height: '100%', background: unqualifiedData.konsumsiCount >= 10 ? '#10b981' : '#f59e0b', transition: 'width 0.3s' }} />
                  </div>
                </div>

                {/* Pemberian Progress */}
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>🤝 Pemberian PKMK</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: unqualifiedData.pemberianCount >= 10 ? '#059669' : '#d97706' }}>
                      {unqualifiedData.pemberianCount} / 10 Minggu {unqualifiedData.pemberianCount >= 10 ? '✓' : `(Kurang ${10 - unqualifiedData.pemberianCount})`}
                    </span>
                  </div>
                  <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (unqualifiedData.pemberianCount / 10) * 100)}%`, height: '100%', background: unqualifiedData.pemberianCount >= 10 ? '#10b981' : '#f59e0b', transition: 'width 0.3s' }} />
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 12, color: '#64748b', marginTop: 16, textAlign: 'center', fontStyle: 'italic' }}>
                Silakan lengkapi entri data pemantauan minggu berjalan hingga minimal 10 minggu untuk mengaktifkan aksi Selesai Intervensi.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setUnqualifiedModalOpen(false)} className="modal-close-btn">
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Confirmation & AI Summary for Finishing Intervention (Case B) */}
      {finishModalOpen && finishModalData && (
        <div className="modal-overlay" onClick={() => setFinishModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header type-finish">
              <div className="modal-header-content">
                <div className="modal-icon">
                  <Award size={22} color="white" />
                </div>
                <div>
                  <h2 className="modal-title">Konfirmasi Selesai Intervensi</h2>
                  <p className="modal-subtitle">
                    {finishModalData.balitaName} • Siklus {finishModalData.cycleNum}
                  </p>
                </div>
              </div>
              <button className="modal-close-x" onClick={() => setFinishModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: 14, borderRadius: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#047857', margin: 0, fontWeight: 600 }}>
                  🎉 Selamat! Balita ini telah memenuhi kriteria pemantauan intervensi ≥10 minggu (Antropometri: {finishModalData.antroCount}m, Konsumsi: {finishModalData.konsumsiCount}m, Pemberian: {finishModalData.pemberianCount}m).
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>
                    Tanggal Selesai Intervensi
                  </label>
                  <input
                    type="date"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    style={{ width: '100%', height: 42, borderRadius: 8, border: '1px solid #cbd5e1', padding: '0 12px', fontSize: 14, outline: 'none' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      Catatan Evaluasi Intervensi
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!finishModalData) return;
                        setSubmittingFinish(true);
                        try {
                          const { getAiDischargeSummary } = await import("@/app/actions/ai-advisor");
                          const res = await getAiDischargeSummary({
                            namaBalita: finishModalData.balitaName,
                            nik: finishModalData.nik,
                            desa: finishModalData.desa,
                            cycleNum: finishModalData.cycleNum,
                            antroCount: finishModalData.antroCount,
                            konsumsiCount: finishModalData.konsumsiCount,
                            pemberianCount: finishModalData.pemberianCount,
                          });
                          if (res.success && res.data) {
                            setCompletionNotes(res.data);
                          } else {
                            alert("AI Info: " + (res.error || "Gagal menghubungi Gemini API"));
                          }
                        } catch (err: any) {
                          alert("Error: " + err.message);
                        } finally {
                          setSubmittingFinish(false);
                        }
                      }}
                      disabled={submittingFinish}
                      style={{
                        padding: '4px 10px', borderRadius: 6, border: 'none',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        boxShadow: '0 2px 6px rgba(99,102,241,0.3)'
                      }}
                    >
                      <Sparkles size={13} />
                      {submittingFinish ? 'Memproses AI...' : '✨ Generasi Evaluasi AI'}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Tuliskan catatan evaluasi klinis akhir siklus atau klik tombol Generasi Evaluasi AI..."
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    style={{ width: '100%', borderRadius: 8, border: '1px solid #cbd5e1', padding: 10, fontSize: 13, outline: 'none', resize: 'vertical' }}
                  />
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6366f1', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
                    <Sparkles size={16} /> AI Executive Clinical Summary
                  </div>
                  <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                    Setelah ditandai Selesai, balita ini akan di-unblock sehingga dapat didaftarkan untuk <strong>Siklus {finishModalData.cycleNum + 1}</strong> di Daftar Kohort jika terapi PKMK berlanjut.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setFinishModalOpen(false)}
                style={{ flex: 1, padding: 12, background: 'white', border: '1px solid #cbd5e1', borderRadius: 10, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmFinish}
                disabled={submittingFinish}
                className="modal-confirm-btn"
                style={{ flex: 1.5 }}
              >
                {submittingFinish ? 'Memproses...' : '✅ Selesaikan Intervensi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Completed Cohort Details (Case C) */}
      {completedDetailModalOpen && completedDetailData && (
        <div className="modal-overlay" onClick={() => setCompletedDetailModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header type-completed">
              <div className="modal-header-content">
                <div className="modal-icon">
                  <Award size={22} color="white" />
                </div>
                <div>
                  <h2 className="modal-title">Detail Selesai Intervensi</h2>
                  <p className="modal-subtitle">
                    {completedDetailData.balitaName} • Siklus {completedDetailData.cycleNum}
                  </p>
                </div>
              </div>
              <button className="modal-close-x" onClick={() => setCompletedDetailModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: 14, borderRadius: 12, marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: '#047857', margin: 0, fontWeight: 700 }}>
                  ✓ Status Intervensi: SELESAI (Siklus {completedDetailData.cycleNum})
                </p>
                <p style={{ fontSize: 12, color: '#065f46', marginTop: 4, margin: 0 }}>
                  Tanggal Selesai: <strong>{completedDetailData.cohort.periode_selesai ? new Date(completedDetailData.cohort.periode_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</strong>
                </p>
              </div>

              <div className="modal-data-grid">
                <div className="modal-data-item">
                  <div className="modal-data-label">Antropometri Terpantau</div>
                  <div className="modal-data-value positive">{completedDetailData.antroCount} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>minggu</span></div>
                </div>
                <div className="modal-data-item">
                  <div className="modal-data-label">Konsumsi Terpantau</div>
                  <div className="modal-data-value positive">{completedDetailData.konsumsiCount} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>minggu</span></div>
                </div>
                <div className="modal-data-item full-width">
                  <div className="modal-data-label">Pemberian Terpantau</div>
                  <div className="modal-data-value positive">{completedDetailData.pemberianCount} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>minggu</span></div>
                </div>
                {completedDetailData.cohort.catatan && (
                  <div className="modal-data-item full-width">
                    <div className="modal-data-label">Catatan Evaluasi</div>
                    <div className="modal-data-value small">{completedDetailData.cohort.catatan}</div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setCompletedDetailModalOpen(false)} className="modal-close-btn">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
