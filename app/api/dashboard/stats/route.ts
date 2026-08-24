import { NextResponse } from "next/server";
import { createAdminClient as createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export async function GET() {
  try {
    const supabase = await createClient();
    const appUser = await getAppUser();

    console.log('[/api/dashboard/stats] appUser:', appUser);

    // 1. Get balita count
    let balitaQuery = supabase.from("balita").select("id", { count: "exact" });
    if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
      balitaQuery = balitaQuery.eq('puskesmas_id', appUser.puskesmas_id);
    }
    const { count: balitaCount, data: balitaData } = await balitaQuery;
    const finalBalitaCount = balitaCount ?? balitaData?.length ?? 0;

    // 2. Get kohort count
    let kohortQuery = supabase.from("kohort").select("id", { count: "exact" });
    if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
      kohortQuery = kohortQuery.eq('puskesmas_id', appUser.puskesmas_id);
    }
    const { count: kohortCount, data: kohortData } = await kohortQuery;
    const finalKohortCount = kohortCount ?? kohortData?.length ?? 0;

    // 3. Get recent monitoring count (last 30 days fallback if last 7 days is empty)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 30);

    let monitoringQuery = supabase
      .from("monitoring_antropometri")
      .select("id", { count: "exact" })
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
    const { count: monitoringCount, data: monitoringData } = await monitoringQuery;
    const finalMonitoringCount = monitoringCount ?? monitoringData?.length ?? 0;

    // Get puskesmas info if admin_puskesmas
    let puskesmasName = null;
    if (appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id) {
      const { data } = await supabase
        .from("ref_puskesmas")
        .select("nama")
        .eq("id", appUser.puskesmas_id)
        .single();
      puskesmasName = data?.nama ?? null;
    }

    console.log('[/api/dashboard/stats] Returning:', {
      balitaCount: finalBalitaCount,
      kohortCount: finalKohortCount,
      monitoringCount: finalMonitoringCount,
      role: appUser?.role || 'superadmin',
      puskesmasName
    });

    return NextResponse.json({
      balitaCount: finalBalitaCount,
      kohortCount: finalKohortCount,
      monitoringCount: finalMonitoringCount,
      role: appUser?.role || 'superadmin',
      puskesmasName
    });
  } catch (error: any) {
    console.error('[/api/dashboard/stats] Error:', error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}
