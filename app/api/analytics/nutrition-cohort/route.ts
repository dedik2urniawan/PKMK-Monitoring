import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { createAdminClient as createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

/**
 * API untuk mengambil data cohort trend bulanan Z-Score dan Delta BB
 * GET /api/analytics/nutrition-cohort
 * Returns: { months: [{ month: "Nov 2025", avg_bbu: -2.5, avg_tbu: -2.8, avg_bbtb: -1.5, avg_delta_bb: 0.05 }, ...] }
 */
export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const appUser = await getAppUser();

    if (!appUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Build base query with puskesmas filter for admin_puskesmas
        let query = supabase
            .from("monitoring_antropometri")
            .select(`
                tanggal,
                zs_bbu,
                zs_tbu,
                zs_bbtb,
                delta_bb_kg,
                kohort:kohort_id (
                    puskesmas_id
                )
            `)
            .not("tanggal", "is", null)
            .order("tanggal", { ascending: true });

        // Filter by puskesmas for admin_puskesmas users
        if (appUser.role === "admin_puskesmas" && appUser.puskesmas_id) {
            query = query.eq("kohort.puskesmas_id", appUser.puskesmas_id);
        }

        const { data, error } = await query;

        if (error) {
            console.error("[API nutrition-cohort] Query error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Group by month and calculate averages
        const monthlyData: Record<string, {
            count: number;
            sum_bbu: number;
            sum_tbu: number;
            sum_bbtb: number;
            sum_delta_bb: number;
            count_bbu: number;
            count_tbu: number;
            count_bbtb: number;
            count_delta_bb: number;
        }> = {};

        (data || []).forEach((row: any) => {
            if (!row.tanggal) return;

            const date = new Date(row.tanggal);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    count: 0,
                    sum_bbu: 0,
                    sum_tbu: 0,
                    sum_bbtb: 0,
                    sum_delta_bb: 0,
                    count_bbu: 0,
                    count_tbu: 0,
                    count_bbtb: 0,
                    count_delta_bb: 0,
                };
            }

            monthlyData[monthKey].count++;

            if (row.zs_bbu !== null && row.zs_bbu !== undefined) {
                monthlyData[monthKey].sum_bbu += Number(row.zs_bbu);
                monthlyData[monthKey].count_bbu++;
            }
            if (row.zs_tbu !== null && row.zs_tbu !== undefined) {
                monthlyData[monthKey].sum_tbu += Number(row.zs_tbu);
                monthlyData[monthKey].count_tbu++;
            }
            if (row.zs_bbtb !== null && row.zs_bbtb !== undefined) {
                monthlyData[monthKey].sum_bbtb += Number(row.zs_bbtb);
                monthlyData[monthKey].count_bbtb++;
            }
            if (row.delta_bb_kg !== null && row.delta_bb_kg !== undefined) {
                monthlyData[monthKey].sum_delta_bb += Number(row.delta_bb_kg);
                monthlyData[monthKey].count_delta_bb++;
            }
        });

        // Convert to array and format month names
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

        const months = Object.keys(monthlyData)
            .sort()
            .map(key => {
                const [year, month] = key.split("-");
                const monthName = monthNames[parseInt(month) - 1];
                const data = monthlyData[key];

                return {
                    month: `${monthName} ${year}`,
                    monthKey: key,
                    avg_bbu: data.count_bbu > 0 ? Math.round((data.sum_bbu / data.count_bbu) * 100) / 100 : null,
                    avg_tbu: data.count_tbu > 0 ? Math.round((data.sum_tbu / data.count_tbu) * 100) / 100 : null,
                    avg_bbtb: data.count_bbtb > 0 ? Math.round((data.sum_bbtb / data.count_bbtb) * 100) / 100 : null,
                    avg_delta_bb: data.count_delta_bb > 0 ? Math.round((data.sum_delta_bb / data.count_delta_bb) * 1000) / 1000 : null,
                    total_entries: data.count,
                };
            });

        console.log("[API nutrition-cohort] Returning", months.length, "months of data");

        return NextResponse.json({ months });
    } catch (err: any) {
        console.error("[API nutrition-cohort] Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
