import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// PUBLIC API - No auth required
// Returns aggregate statistics for landing page display
export async function GET() {
    try {
        const supabase = await createClient();

        // Get current date info
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();

        const periodStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
        const periodEnd = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${lastDayOfMonth}`;

        // 1. Count total balita (cumulative)
        const { count: totalBalita } = await supabase
            .from("balita")
            .select("id", { count: "exact", head: true });

        // 2. Count total kohort (balita yang sudah ada kohort)
        const { data: kohortData } = await supabase
            .from("kohort")
            .select("balita_id")
            .lte("periode_mulai", periodEnd);

        const uniqueBalitaWithKohort = new Set(kohortData?.map((k: any) => k.balita_id) || []).size;

        // 3. Count monitoring entries this month
        const { count: antropometriCount } = await supabase
            .from("monitoring_antropometri")
            .select("id", { count: "exact", head: true })
            .gte("tanggal", periodStart)
            .lte("tanggal", periodEnd);

        const { count: konsumsiCount } = await supabase
            .from("monitoring_pkmk_konsumsi")
            .select("id", { count: "exact", head: true })
            .gte("tanggal", periodStart)
            .lte("tanggal", periodEnd);

        const { count: pemberianCount } = await supabase
            .from("monitoring_pkmk_pemberian")
            .select("id", { count: "exact", head: true })
            .gte("tanggal", periodStart)
            .lte("tanggal", periodEnd);

        // 4. Calculate compliance percentage
        const compliancePercentage = totalBalita && totalBalita > 0
            ? Math.round((uniqueBalitaWithKohort / totalBalita) * 100)
            : 0;

        // 5. Get last 5 months monitoring trend
        const monthlyTrend = [];
        for (let i = 4; i >= 0; i--) {
            const targetDate = new Date(currentYear, currentMonth - 1 - i, 1);
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth() + 1;
            const lastDay = new Date(year, month, 0).getDate();

            const start = `${year}-${String(month).padStart(2, '0')}-01`;
            const end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

            const { count } = await supabase
                .from("monitoring_antropometri")
                .select("id", { count: "exact", head: true })
                .gte("tanggal", start)
                .lte("tanggal", end);

            monthlyTrend.push({
                month: `M${5 - i}`,
                label: targetDate.toLocaleDateString('id-ID', { month: 'short' }),
                count: count || 0
            });
        }

        // Find max for percentage calculation
        const maxCount = Math.max(...monthlyTrend.map(m => m.count), 1);

        // 6. Count puskesmas aktif (yang punya data)
        const { data: activePuskesmas } = await supabase
            .from("balita")
            .select("puskesmas_id")
            .not("puskesmas_id", "is", null);

        const uniquePuskesmas = new Set(activePuskesmas?.map((b: any) => b.puskesmas_id) || []).size;

        // Response with CORS headers for iframe embed
        const response = NextResponse.json({
            totalBalita: totalBalita || 0,
            balitaWithKohort: uniqueBalitaWithKohort,
            compliancePercentage,
            monitoringThisMonth: {
                antropometri: antropometriCount || 0,
                konsumsi: konsumsiCount || 0,
                pemberian: pemberianCount || 0,
                total: (antropometriCount || 0) + (konsumsiCount || 0) + (pemberianCount || 0)
            },
            monthlyTrend: monthlyTrend.map(m => ({
                ...m,
                percentage: Math.round((m.count / maxCount) * 100)
            })),
            puskesmasAktif: uniquePuskesmas,
            periode: {
                bulan: now.toLocaleDateString('id-ID', { month: 'long' }),
                tahun: currentYear
            },
            lastUpdated: now.toISOString()
        });

        // Add CORS headers for cross-origin iframe access
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET');
        response.headers.set('Cache-Control', 'public, max-age=300'); // Cache 5 minutes

        return response;
    } catch (error: any) {
        console.error("[Public Stats API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch statistics" },
            { status: 500 }
        );
    }
}
