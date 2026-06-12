import { NextResponse } from "next/server";
import { createAdminClient as createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export async function GET() {
    try {
        const supabase = await createClient();
        const appUser = await getAppUser();

        console.log('[/api/dashboard/stats] appUser:', appUser);

        // Get balita count
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
            } else {
                // No kohorts, return 0
                return NextResponse.json({
                    balitaCount: balitaCount ?? 0,
                    kohortCount: kohortCount ?? 0,
                    monitoringCount: 0,
                    role: appUser?.role ?? null,
                    puskesmasName: null
                });
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
            puskesmasName = data?.nama ?? null;
        }

        console.log('[/api/dashboard/stats] Returning:', {
            balitaCount: balitaCount ?? 0,
            kohortCount: kohortCount ?? 0,
            monitoringCount: monitoringCount ?? 0,
            role: appUser?.role,
            puskesmas_id: appUser?.puskesmas_id,
            puskesmasName
        });

        return NextResponse.json({
            balitaCount: balitaCount ?? 0,
            kohortCount: kohortCount ?? 0,
            monitoringCount: monitoringCount ?? 0,
            role: appUser?.role ?? null,
            puskesmasName
        });
    } catch (error) {
        console.error('[/api/dashboard/stats] Error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
