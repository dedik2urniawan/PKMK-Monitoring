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
          gap: 24px;
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
          border-radius: 12px;
          border: 1px solid #dce5e4;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          transition: all 0.2s;
        }
        .stat-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .stat-icon.blue {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }
        .stat-card:hover .stat-icon.blue {
          background: #3b82f6;
          color: white;
        }
        .stat-icon.teal {
          background: rgba(20, 184, 166, 0.1);
          color: #14b8a6;
        }
        .stat-card:hover .stat-icon.teal {
          background: #14b8a6;
          color: white;
        }
        .stat-icon.orange {
          background: rgba(249, 115, 22, 0.1);
          color: #f97316;
        }
        .stat-card:hover .stat-icon.orange {
          background: #f97316;
          color: white;
        }
        .stat-icon.purple {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }
        .stat-card:hover .stat-icon.purple {
          background: #8b5cf6;
          color: white;
        }
        .stat-badge {
          font-size: 12px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 9999px;
        }
        .stat-badge.green {
          background: rgba(34, 197, 94, 0.1);
          color: #16a34a;
        }
        .stat-badge.gray {
          background: #f1f5f9;
          color: #64748b;
        }
        .stat-label {
          font-size: 14px;
          font-weight: 500;
          color: #638884;
          margin-bottom: 4px;
        }
        .stat-value {
          font-size: 30px;
          font-weight: 700;
          color: #111817;
        }
        .stat-value.small {
          font-size: 24px;
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
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon blue">
                <Users size={24} />
              </div>
              <span className="stat-badge green">+12%</span>
            </div>
            <p className="stat-label">Total Balita</p>
            <h3 className="stat-value">{balitaCount ?? 0}</h3>
          </div>

          {/* Kohort Aktif Card */}
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon teal">
                <ClipboardList size={24} />
              </div>
            </div>
            <p className="stat-label">Kohort Aktif</p>
            <h3 className="stat-value">{kohortCount ?? 0}</h3>
          </div>

          {/* Monitoring 7 Hari Card */}
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon orange">
                <Activity size={24} />
              </div>
              {(monitoringCount ?? 0) === 0 && (
                <span className="stat-badge gray">Low Activity</span>
              )}
            </div>
            <p className="stat-label">Monitoring (7 Hari)</p>
            <h3 className="stat-value">{monitoringCount ?? 0}</h3>
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
