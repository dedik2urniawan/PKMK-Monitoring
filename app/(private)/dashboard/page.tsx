import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";
import Link from "next/link";
import { Users, Activity, TrendingUp, Plus, FileText, List, ClipboardList, Calendar, Zap } from "lucide-react";
import AnalyticsSection from "./components/AnalyticsSection";
import WelcomeModal from "./components/WelcomeModal";
import UserInfoBadge from "@/components/UserInfoBadge";
import RoleCard from "@/components/RoleCard";

export default async function Dashboard() {
  // Get supabase for data queries (no auth check - handled client-side)
  const supabase = await createClient();
  const appUser = await getAppUser();

  // Fetch statistics
  let balitaQuery = supabase.from("balita").select("id", { head: true, count: "exact" });
  if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
    balitaQuery = balitaQuery.eq('puskesmas_id', appUser.puskesmas_id);
  }
  const { count: balitaCount } = await balitaQuery;

  // Get kohort count
  let kohortQuery = supabase.from("kohort").select("id", { head: true, count: "exact" });
  if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
    kohortQuery = kohortQuery.eq('puskesmas_id', appUser.puskesmas_id);
  }
  const { count: kohortCount } = await kohortQuery;

  // Get recent monitoring count (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  let monitoringQuery = supabase
    .from("monitoring_antropometri")
    .select("id", { head: true, count: "exact" })
    .gte('tanggal', sevenDaysAgo.toISOString().split('T')[0]);

  if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
    const { data: kohortIds } = await supabase
      .from("kohort")
      .select("id")
      .eq('puskesmas_id', appUser.puskesmas_id);
    if (kohortIds && kohortIds.length > 0) {
      monitoringQuery = monitoringQuery.in('kohort_id', kohortIds.map(k => k.id));
    }
  }
  const { count: monitoringCount } = await monitoringQuery;

  // Get puskesmas info if admin_puskesmas
  let puskesmasName = null;
  if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
    const { data } = await supabase
      .from("ref_puskesmas")
      .select("nama")
      .eq("id", appUser.puskesmas_id)
      .single();
    puskesmasName = data?.nama;
  }

  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <>
      <style>{`
        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 32px;
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
          font-size: 30px;
          font-weight: 900;
          color: #111817;
          letter-spacing: -0.025em;
        }
        .page-subtitle {
          color: #638884;
          margin-top: 4px;
        }
        .date-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #638884;
          background: white;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #dce5e4;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }
        @media (min-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        .stat-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          border-radius: 16px 0 0 16px;
          transition: all 0.3s ease;
        }
        .stat-card.blue-accent::before { background: linear-gradient(180deg, #3b82f6, #2563eb); }
        .stat-card.teal-accent::before { background: linear-gradient(180deg, #14b8a6, #0d9488); }
        .stat-card.orange-accent::before { background: linear-gradient(180deg, #f97316, #ea580c); }
        .stat-card.purple-accent::before { background: linear-gradient(180deg, #8b5cf6, #7c3aed); }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -8px rgba(0,0,0,0.12);
        }
        .stat-card-decoration {
          position: absolute;
          top: -30px;
          right: -30px;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          opacity: 0.5;
        }
        .stat-card.blue-accent .stat-card-decoration { background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05)); }
        .stat-card.teal-accent .stat-card-decoration { background: linear-gradient(135deg, rgba(20,184,166,0.2), rgba(20,184,166,0.05)); }
        .stat-card.orange-accent .stat-card-decoration { background: linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.05)); }
        .stat-card.purple-accent .stat-card-decoration { background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05)); }
        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }
        .stat-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        .stat-icon.blue {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
        }
        .stat-icon.teal {
          background: linear-gradient(135deg, #14b8a6, #0d9488);
          color: white;
          box-shadow: 0 4px 12px rgba(20, 184, 166, 0.35);
        }
        .stat-icon.orange {
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.35);
        }
        .stat-icon.purple {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.35);
        }
        .stat-card:hover .stat-icon {
          transform: scale(1.05);
        }
        .stat-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 10px;
          border-radius: 20px;
        }
        .stat-badge.green {
          background: linear-gradient(135deg, #ecfdf5, #d1fae5);
          color: #059669;
        }
        .stat-badge.gray {
          background: #fef3c7;
          color: #d97706;
        }
        .stat-badge.blue {
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          color: #2563eb;
        }
        .stat-label {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          position: relative;
          z-index: 1;
        }
        .stat-value {
          font-size: 34px;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.1;
          position: relative;
          z-index: 1;
        }
        .stat-value.small {
          font-size: 22px;
        }
        .stat-hint {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 8px;
          position: relative;
          z-index: 1;
        }
        .quick-actions-section {
          margin-bottom: 32px;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 700;
          color: #111817;
          margin-bottom: 16px;
        }
        .section-title-icon {
          color: #14b8a6;
        }
        .quick-actions-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #dce5e4;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .quick-actions-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        .action-btn-primary {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 24px;
          background: #14b8a6;
          color: white;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          box-shadow: 0 10px 15px rgba(20, 184, 166, 0.3);
          transition: all 0.2s;
        }
        .action-btn-primary:hover {
          background: #0d9488;
          transform: translateY(-2px);
        }
        .action-btn-outline {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 24px;
          background: white;
          color: #14b8a6;
          border: 2px solid #14b8a6;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s;
        }
        .action-btn-outline:hover {
          background: rgba(20, 184, 166, 0.05);
        }
        .action-btn-secondary {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 24px;
          background: white;
          color: #111817;
          border: 1px solid #dce5e4;
          border-radius: 12px;
          font-weight: 500;
          font-size: 14px;
          text-decoration: none;
          transition: all 0.2s;
          margin-left: auto;
        }
        .action-btn-secondary:hover {
          background: #f6f8f8;
        }
        .info-panel {
          background: linear-gradient(135deg, rgba(20, 184, 166, 0.05), transparent);
          border: 1px solid #dce5e4;
          border-radius: 12px;
          padding: 24px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 32px;
        }
        .info-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(20, 184, 166, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #14b8a6;
        }
        .info-title {
          font-weight: 600;
          color: #111817;
          margin-bottom: 4px;
        }
        .info-text {
          font-size: 14px;
          color: #638884;
          line-height: 1.6;
        }
      `}</style>

      <div className="dashboard-container">
        <WelcomeModal />

        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              <UserInfoBadge fallbackText="Ringkasan data pemantauan dan intervensi gizi." />
            </p>
          </div>
          <div className="date-badge">
            <Calendar size={16} />
            <span>Update Terakhir: {today}</span>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="stats-grid">
          {/* Total Balita Card */}
          <div className="stat-card blue-accent">
            <div className="stat-card-decoration" />
            <div className="stat-header">
              <div className="stat-icon blue">
                <Users size={24} />
              </div>
              <span className="stat-badge green">
                <TrendingUp size={12} />
                +12%
              </span>
            </div>
            <p className="stat-label">Total Balita</p>
            <h3 className="stat-value">{balitaCount ?? 0}</h3>
            <p className="stat-hint">Terdaftar dalam program PKMK</p>
          </div>

          {/* Kohort Aktif Card */}
          <div className="stat-card teal-accent">
            <div className="stat-card-decoration" />
            <div className="stat-header">
              <div className="stat-icon teal">
                <ClipboardList size={24} />
              </div>
              <span className="stat-badge blue">Aktif</span>
            </div>
            <p className="stat-label">Kohort Aktif</p>
            <h3 className="stat-value">{kohortCount ?? 0}</h3>
            <p className="stat-hint">Kohort program saat ini</p>
          </div>

          {/* Monitoring 7 Hari Card */}
          <div className="stat-card orange-accent">
            <div className="stat-card-decoration" />
            <div className="stat-header">
              <div className="stat-icon orange">
                <Activity size={24} />
              </div>
              {(monitoringCount ?? 0) === 0 ? (
                <span className="stat-badge gray">⚠ Low Activity</span>
              ) : (
                <span className="stat-badge green">
                  <TrendingUp size={12} />
                  Active
                </span>
              )}
            </div>
            <p className="stat-label">Monitoring (7 Hari)</p>
            <h3 className="stat-value">{monitoringCount ?? 0}</h3>
            <p className="stat-hint">Pengukuran 7 hari terakhir</p>
          </div>

          {/* Role Card - Client Component for persistent role after refresh */}
          <RoleCard />
        </div>

        {/* Quick Actions */}
        <section className="quick-actions-section">
          <h3 className="section-title">
            <Zap size={20} className="section-title-icon" />
            Quick Actions
          </h3>
          <div className="quick-actions-card">
            <div className="quick-actions-grid">
              <Link href="/balita/new" className="action-btn-primary">
                <Plus size={20} />
                Tambah Balita
              </Link>
              <Link href="/kohort/new" className="action-btn-outline">
                <ClipboardList size={20} />
                Buat Kohort
              </Link>
              <Link href="/rekap-laporan" className="action-btn-secondary">
                <FileText size={20} />
                Download Laporan Bulanan
              </Link>
            </div>
          </div>
        </section>

        {/* Analytics Section */}
        <AnalyticsSection />

        {/* Info Panel - Tentang Sistem PKMK */}
        <div className="info-panel">
          <div className="info-icon">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="info-title">Tentang Sistem PKMK</h3>
            <p className="info-text">
              Aplikasi Intervensi Stunting dan Monitoring Evaluasi menggunakan formula ONS (Oral Nutrition Supplement)
              atau PKMK (Pangan Olahan untuk Keperluan Medis Khusus) dengan pendampingan dan asistensi medis oleh
              Dokter Pediatrik Dinas Kesehatan Kabupaten Malang.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
