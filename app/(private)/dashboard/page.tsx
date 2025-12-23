import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Activity, TrendingUp, Plus, FileText, List, ClipboardList } from "lucide-react";
import AnalyticsSection from "./components/AnalyticsSection";
import WelcomeModal from "./components/WelcomeModal";

export default async function Dashboard() {
  const supabase = await createClient();
  const appUser = await getAppUser();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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

  return (
    <div className="space-y-6">
      {/* Welcome Modal */}
      <WelcomeModal />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Dashboard</h1>
        {puskesmasName && (
          <p className="text-sm text-[var(--muted-foreground)] mt-1">
            Puskesmas {puskesmasName}
          </p>
        )}
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Balita Card */}
        <div className="relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:shadow-md transition-shadow overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[var(--primary)] to-transparent opacity-10 rounded-bl-full" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Users className="h-4 w-4" />
                <span>Total Balita</span>
              </div>
              <div className="text-3xl font-bold mt-2 text-[var(--foreground)]">{balitaCount ?? 0}</div>
              <div className="text-xs text-rgb(var(--success)) mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>Terdaftar</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-[var(--primary)]" />
            </div>
          </div>
        </div>

        {/* Active Kohort Card */}
        <div className="relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:shadow-md transition-shadow overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-rgb(var(--info)) to-transparent opacity-10 rounded-bl-full" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <ClipboardList className="h-4 w-4" />
                <span>Kohort Aktif</span>
              </div>
              <div className="text-3xl font-bold mt-2 text-[var(--foreground)]">{kohortCount ?? 0}</div>
              <div className="text-xs text-rgb(var(--info)) mt-1">Periode berjalan</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-rgb(var(--info))/10 flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-rgb(var(--info))" />
            </div>
          </div>
        </div>

        {/* Recent Monitoring Card */}
        <div className="relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:shadow-md transition-shadow overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-rgb(var(--warning)) to-transparent opacity-10 rounded-bl-full" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <Activity className="h-4 w-4" />
                <span>Monitoring (7 Hari)</span>
              </div>
              <div className="text-3xl font-bold mt-2 text-[var(--foreground)]">{monitoringCount ?? 0}</div>
              <div className="text-xs text-rgb(var(--warning)) mt-1">Entri terbaru</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-rgb(var(--warning))/10 flex items-center justify-center">
              <Activity className="h-6 w-6 text-rgb(var(--warning))" />
            </div>
          </div>
        </div>

        {/* User Role Card */}
        <div className="relative rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--primary)]/5 to-transparent p-5 hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <FileText className="h-4 w-4" />
                <span>Role Anda</span>
              </div>
              <div className="text-lg font-semibold mt-2 text-[var(--foreground)] capitalize">
                {appUser?.role === 'admin_puskesmas' ? 'Admin Puskesmas' : appUser?.role || 'User'}
              </div>
              <div className="text-xs text-[var(--muted-foreground)] mt-1">{user.email}</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
              <FileText className="h-6 w-6 text-[var(--primary)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-[var(--foreground)]">Quick Actions</h2>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <Link
            href="/balita/new"
            className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)] hover:shadow-md transition-all"
          >
            <div className="h-12 w-12 rounded-full bg-[var(--primary)]/10 group-hover:bg-[var(--primary)]/20 flex items-center justify-center transition-colors">
              <Plus className="h-6 w-6 text-[var(--primary)]" />
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-[var(--foreground)]">Tambah Balita</div>
              <div className="text-xs text-[var(--muted-foreground)]">Daftar baru</div>
            </div>
          </Link>

          <Link
            href="/kohort/new"
            className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-rgb(var(--info)) hover:shadow-md transition-all"
          >
            <div className="h-12 w-12 rounded-full bg-rgb(var(--info))/10 group-hover:bg-rgb(var(--info))/20 flex items-center justify-center transition-colors">
              <ClipboardList className="h-6 w-6 text-rgb(var(--info))" />
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-[var(--foreground)]">Buat Kohort</div>
              <div className="text-xs text-[var(--muted-foreground)]">Periode baru</div>
            </div>
          </Link>

          <Link
            href="/balita"
            className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-rgb(var(--warning)) hover:shadow-md transition-all"
          >
            <div className="h-12 w-12 rounded-full bg-rgb(var(--warning))/10 group-hover:bg-rgb(var(--warning))/20 flex items-center justify-center transition-colors">
              <List className="h-6 w-6 text-rgb(var(--warning))" />
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-[var(--foreground)]">Kelola Balita</div>
              <div className="text-xs text-[var(--muted-foreground)]">Lihat data</div>
            </div>
          </Link>

          <Link
            href="/balita"
            className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-rgb(var(--success)) hover:shadow-md transition-all"
          >
            <div className="h-12 w-12 rounded-full bg-rgb(var(--success))/10 group-hover:bg-rgb(var(--success))/20 flex items-center justify-center transition-colors">
              <Activity className="h-6 w-6 text-rgb(var(--success))" />
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-[var(--foreground)]">Input Monitoring</div>
              <div className="text-xs text-[var(--muted-foreground)]">Antropometri</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Analytics Section */}
      <AnalyticsSection />

      {/* Info Panel */}
      <div className="rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-transparent p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
            <FileText className="h-6 w-6 text-[var(--primary)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)] mb-1">Tentang Sistem PKMK</h3>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              Aplikasi Intervensi Stunting dan Monitoring Evaluasi menggunakan formula ONS (Oral Nutrition Supplement)
              atau PKMK (Pangan Olahan untuk Keperluan Medis Khusus) dengan pendampingan dan asistensi medis oleh
              Dokter Pediatrik Dinas Kesehatan Kabupaten Malang.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
