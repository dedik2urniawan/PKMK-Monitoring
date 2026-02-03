import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Question definitions with risk logic
const QUESTIONS: Record<string, { label: string; section: string; riskAnswer: string }> = {
    q2_1_lbw: { label: "Berat lahir <2,5 kg", section: "Riwayat Kelahiran & Ibu", riskAnswer: "Ya" },
    q2_2_hf_delivery: { label: "Lahir di fasilitas kesehatan", section: "Riwayat Kelahiran & Ibu", riskAnswer: "Tidak" },
    q2_3_anc4: { label: "Kunjungan ANC ≥4 kali", section: "Riwayat Kelahiran & Ibu", riskAnswer: "Tidak" },
    q2_4_mat_height_low: { label: "Tinggi ibu <150 cm", section: "Riwayat Kelahiran & Ibu", riskAnswer: "Ya" },
    q2_5_mat_underweight: { label: "Ibu kurus (IMT <18,5)", section: "Riwayat Kelahiran & Ibu", riskAnswer: "Ya" },
    q2_6_low_mat_edu: { label: "Pendidikan ibu SMP ke bawah", section: "Riwayat Kelahiran & Ibu", riskAnswer: "Ya" },
    q3_1_ebf: { label: "ASI eksklusif 0-6 bulan", section: "ASI & MP-ASI", riskAnswer: "Tidak" },
    q3_2_cf_6m: { label: "MP-ASI tepat 6 bulan", section: "ASI & MP-ASI", riskAnswer: "Tidak" },
    q3_3_current_bf: { label: "Masih disusui", section: "ASI & MP-ASI", riskAnswer: "Tidak" },
    q3_4_min_meal_freq: { label: "Frekuensi makan minimal", section: "ASI & MP-ASI", riskAnswer: "Tidak" },
    q3_5_mdd: { label: "Keragaman pangan ≥4 kelompok", section: "ASI & MP-ASI", riskAnswer: "Tidak" },
    q4_1_diarrhea: { label: "Diare 2 minggu terakhir", section: "Penyakit Infeksi", riskAnswer: "Ya" },
    q4_1a_recurrent_diarrhea: { label: "Diare berulang", section: "Penyakit Infeksi", riskAnswer: "Ya" },
    q4_2_ari: { label: "ISPA", section: "Penyakit Infeksi", riskAnswer: "Ya" },
    q4_3_fever: { label: "Demam ≥2 hari", section: "Penyakit Infeksi", riskAnswer: "Ya" },
    q4_4_helminth: { label: "Cacingan 6 bulan terakhir", section: "Penyakit Infeksi", riskAnswer: "Ya" },
    q5_1_safe_water: { label: "Air minum layak", section: "WASH & Ekonomi", riskAnswer: "Tidak" },
    q5_2_water_treat: { label: "Air diolah", section: "WASH & Ekonomi", riskAnswer: "Tidak" },
    q5_3_improved_san: { label: "Jamban sehat", section: "WASH & Ekonomi", riskAnswer: "Tidak" },
    q5_4_hwws: { label: "Fasilitas cuci tangan", section: "WASH & Ekonomi", riskAnswer: "Tidak" },
    q5_5_overcrowd: { label: "Anggota RT >5 orang", section: "WASH & Ekonomi", riskAnswer: "Ya" },
    q5_6_multi_u5: { label: "≥2 balita dalam rumah", section: "WASH & Ekonomi", riskAnswer: "Ya" },
    q5_7_low_ses: { label: "Status ekonomi rendah", section: "WASH & Ekonomi", riskAnswer: "Ya" },
    q5_8_female_hhh: { label: "KRT perempuan", section: "WASH & Ekonomi", riskAnswer: "Ya" },
    q6_1_non_mat_care: { label: "Ibu bukan pengasuh utama", section: "Pola Pengasuhan", riskAnswer: "Ya" },
    q6_2_child_not_priority: { label: "Anak bukan prioritas makan", section: "Pola Pengasuhan", riskAnswer: "Ya" },
};

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const appUser = await getAppUser();

        console.log('[analysis] appUser:', appUser);

        // Parse filters
        const year = req.nextUrl.searchParams.get('year');
        const month = req.nextUrl.searchParams.get('month');
        const kec = req.nextUrl.searchParams.get('kec');
        const puskesmas_id = req.nextUrl.searchParams.get('puskesmas_id');
        const desa = req.nextUrl.searchParams.get('desa');

        // Get all surveys first
        let surveyQuery = supabase.from('survey_determinan').select('*');

        // Period filter - only apply if year is provided
        if (year && month) {
            const startDate = `${year}-${month.padStart(2, '0')}-01`;
            const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
            surveyQuery = surveyQuery.gte('tanggal_survey', startDate).lte('tanggal_survey', endDate);
        } else if (year) {
            surveyQuery = surveyQuery.gte('tanggal_survey', `${year}-01-01`).lte('tanggal_survey', `${year}-12-31`);
        }

        const { data: allSurveys, error: surveyError } = await surveyQuery;

        console.log('[analysis] surveyQuery result:', { count: allSurveys?.length, error: surveyError });

        if (surveyError) {
            console.error("[analysis] Survey query error:", surveyError);
            return NextResponse.json({ error: surveyError.message }, { status: 500 });
        }

        // Get unique balita IDs from surveys
        const surveyBalitaIds = [...new Set((allSurveys || []).map(s => s.balita_id))];

        if (surveyBalitaIds.length === 0) {
            console.log('[analysis] No surveys found');
            return NextResponse.json({
                summary: { totalSurveys: 0, riskDistribution: { tinggi: 0, sedang: 0, rendah: 0 }, avgRiskScore: 0 },
                factorPrevalence: [],
                geographic: [],
                trends: [],
                userRole: appUser?.role || null,
            });
        }

        // Get balita data for these surveys
        const { data: balitaData, error: balitaError } = await supabase
            .from('balita')
            .select('id, kec, desa_kel, puskesmas_id')
            .in('id', surveyBalitaIds);

        if (balitaError) {
            console.error("[analysis] Balita query error:", balitaError);
            return NextResponse.json({ error: balitaError.message }, { status: 500 });
        }

        // Build balita map
        const balitaMap = new Map<string, { kec: string; desa_kel: string; puskesmas_id: string }>();
        (balitaData || []).forEach(b => {
            balitaMap.set(b.id, { kec: b.kec || '', desa_kel: b.desa_kel || '', puskesmas_id: b.puskesmas_id || '' });
        });

        // Filter surveys based on role and location filters
        let surveys = allSurveys || [];
        const isAdminPuskesmas = appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id;

        if (isAdminPuskesmas) {
            surveys = surveys.filter(s => {
                const balita = balitaMap.get(s.balita_id);
                return balita?.puskesmas_id === appUser.puskesmas_id;
            });
            // Apply desa filter if provided
            if (desa) {
                surveys = surveys.filter(s => {
                    const balita = balitaMap.get(s.balita_id);
                    return balita?.desa_kel === desa;
                });
            }
        } else {
            // Superadmin or no auth - apply location filters if provided
            if (kec) {
                surveys = surveys.filter(s => {
                    const balita = balitaMap.get(s.balita_id);
                    return balita?.kec === kec;
                });
            }
            if (puskesmas_id) {
                surveys = surveys.filter(s => {
                    const balita = balitaMap.get(s.balita_id);
                    return balita?.puskesmas_id === puskesmas_id;
                });
            }
            if (desa) {
                surveys = surveys.filter(s => {
                    const balita = balitaMap.get(s.balita_id);
                    return balita?.desa_kel === desa;
                });
            }
        }

        console.log('[analysis] Final surveys count after filters:', surveys.length);

        // Calculate summary
        const totalSurveys = surveys.length;
        const riskDistribution = { tinggi: 0, sedang: 0, rendah: 0 };
        let totalScore = 0;

        surveys.forEach(s => {
            if (s.risk_category === 'Tinggi') riskDistribution.tinggi++;
            else if (s.risk_category === 'Sedang') riskDistribution.sedang++;
            else riskDistribution.rendah++;
            totalScore += s.risk_score || 0;
        });

        const avgRiskScore = totalSurveys > 0 ? (totalScore / totalSurveys).toFixed(1) : 0;

        // Calculate factor prevalence
        const factorPrevalence: any[] = [];
        Object.entries(QUESTIONS).forEach(([key, config]) => {
            let riskCount = 0;
            let answeredCount = 0;

            surveys.forEach(s => {
                const answer = s[key];
                if (answer) {
                    answeredCount++;
                    if (answer === config.riskAnswer) riskCount++;
                }
            });

            const prevalence = answeredCount > 0 ? ((riskCount / answeredCount) * 100).toFixed(1) : 0;

            factorPrevalence.push({
                key,
                label: config.label,
                section: config.section,
                riskCount,
                answeredCount,
                prevalence: parseFloat(prevalence as string),
            });
        });

        factorPrevalence.sort((a, b) => b.prevalence - a.prevalence);

        // Geographic analysis - use desa for admin_puskesmas, kec for superadmin
        const geoStats = new Map<string, { total: number; tinggi: number; sedang: number; rendah: number }>();

        surveys.forEach(s => {
            const balitaInfo = balitaMap.get(s.balita_id);
            // Use desa_kel for admin_puskesmas, kec for superadmin/dinkes
            const geoName = isAdminPuskesmas ? (balitaInfo?.desa_kel || '') : (balitaInfo?.kec || '');

            if (!geoName) return;

            if (!geoStats.has(geoName)) {
                geoStats.set(geoName, { total: 0, tinggi: 0, sedang: 0, rendah: 0 });
            }
            const stats = geoStats.get(geoName)!;
            stats.total++;
            if (s.risk_category === 'Tinggi') stats.tinggi++;
            else if (s.risk_category === 'Sedang') stats.sedang++;
            else stats.rendah++;
        });

        const geographic = Array.from(geoStats.entries())
            .filter(([name]) => name && name.trim() !== '')
            .map(([name, stats]) => ({
                kecamatan: name, // Keep field name for backward compatibility, but value is desa for admin_puskesmas
                ...stats,
                percentTinggi: stats.total > 0 ? ((stats.tinggi / stats.total) * 100).toFixed(1) : 0,
            }))
            .sort((a, b) => parseFloat(b.percentTinggi as string) - parseFloat(a.percentTinggi as string));

        // Monthly trends
        const monthlyStats = new Map<string, { count: number; tinggi: number; sedang: number; rendah: number; totalScore: number }>();
        surveys.forEach(s => {
            const date = new Date(s.tanggal_survey);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyStats.has(monthKey)) {
                monthlyStats.set(monthKey, { count: 0, tinggi: 0, sedang: 0, rendah: 0, totalScore: 0 });
            }
            const stats = monthlyStats.get(monthKey)!;
            stats.count++;
            stats.totalScore += s.risk_score || 0;
            if (s.risk_category === 'Tinggi') stats.tinggi++;
            else if (s.risk_category === 'Sedang') stats.sedang++;
            else stats.rendah++;
        });

        const trends = Array.from(monthlyStats.entries())
            .map(([month, stats]) => ({
                month,
                count: stats.count,
                avgScore: (stats.totalScore / stats.count).toFixed(1),
                tinggi: stats.tinggi,
                sedang: stats.sedang,
                rendah: stats.rendah,
            }))
            .sort((a, b) => a.month.localeCompare(b.month));

        return NextResponse.json({
            summary: { totalSurveys, riskDistribution, avgRiskScore },
            factorPrevalence,
            geographic,
            trends,
            userRole: appUser?.role || null,
        });
    } catch (err: any) {
        console.error("[analysis] API error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}
