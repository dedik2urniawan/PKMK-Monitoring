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
    q2_6_low_mat_edu: { label: "Pendidikan ibu ≤SMP", section: "Riwayat Kelahiran & Ibu", riskAnswer: "Ya" },
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

// Section order and icons
const SECTIONS = [
    { key: "Riwayat Kelahiran & Ibu", icon: "👶" },
    { key: "ASI & MP-ASI", icon: "🍼" },
    { key: "Penyakit Infeksi", icon: "🏥" },
    { key: "WASH & Ekonomi", icon: "🚿" },
    { key: "Pola Pengasuhan", icon: "👨‍👩‍👧" },
];

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const appUser = await getAppUser();

        // Parse filters
        const year = req.nextUrl.searchParams.get('year');
        const month = req.nextUrl.searchParams.get('month');
        const kec = req.nextUrl.searchParams.get('kec');
        const puskesmas_id = req.nextUrl.searchParams.get('puskesmas_id');
        const desa = req.nextUrl.searchParams.get('desa');

        // Get all surveys
        let surveyQuery = supabase.from('survey_determinan').select('*');

        // Period filter
        if (year && month) {
            const startDate = `${year}-${month.padStart(2, '0')}-01`;
            const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
            surveyQuery = surveyQuery.gte('tanggal_survey', startDate).lte('tanggal_survey', endDate);
        } else if (year) {
            surveyQuery = surveyQuery.gte('tanggal_survey', `${year}-01-01`).lte('tanggal_survey', `${year}-12-31`);
        }

        const { data: allSurveys, error: surveyError } = await surveyQuery;

        if (surveyError) {
            return NextResponse.json({ error: surveyError.message }, { status: 500 });
        }

        if (!allSurveys || allSurveys.length === 0) {
            return NextResponse.json({
                userRole: appUser?.role || null,
                totalSurveys: 0,
                totalPuskesmas: 0,
                totalDesa: 0,
                sections: [],
            });
        }

        // Get balita data for filtering
        const surveyBalitaIds = [...new Set(allSurveys.map(s => s.balita_id))];
        const { data: balitaData } = await supabase
            .from('balita')
            .select('id, kec, desa_kel, puskesmas_id')
            .in('id', surveyBalitaIds);

        const balitaMap = new Map<string, { kec: string; desa_kel: string; puskesmas_id: string }>();
        (balitaData || []).forEach(b => {
            balitaMap.set(b.id, { kec: b.kec || '', desa_kel: b.desa_kel || '', puskesmas_id: b.puskesmas_id || '' });
        });

        // Filter surveys based on role and filters
        let surveys = allSurveys;
        const isAdminPuskesmas = appUser?.role === 'admin_puskesmas' && appUser.puskesmas_id;

        if (isAdminPuskesmas) {
            surveys = surveys.filter(s => {
                const balita = balitaMap.get(s.balita_id);
                return balita?.puskesmas_id === appUser.puskesmas_id;
            });
            if (desa) {
                surveys = surveys.filter(s => {
                    const balita = balitaMap.get(s.balita_id);
                    return balita?.desa_kel === desa;
                });
            }
        } else {
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

        // Count unique puskesmas and desa
        const uniquePuskesmas = new Set<string>();
        const uniqueDesa = new Set<string>();
        surveys.forEach(s => {
            const balita = balitaMap.get(s.balita_id);
            if (balita?.puskesmas_id) uniquePuskesmas.add(balita.puskesmas_id);
            if (balita?.desa_kel) uniqueDesa.add(balita.desa_kel);
        });

        // Calculate tabulation for each question
        const sections: any[] = [];

        SECTIONS.forEach(section => {
            const questions: any[] = [];

            Object.entries(QUESTIONS)
                .filter(([_, config]) => config.section === section.key)
                .forEach(([key, config]) => {
                    let yaCount = 0;
                    let tidakCount = 0;
                    let answeredCount = 0;

                    surveys.forEach(s => {
                        const answer = s[key];
                        if (answer === 'Ya') {
                            yaCount++;
                            answeredCount++;
                        } else if (answer === 'Tidak') {
                            tidakCount++;
                            answeredCount++;
                        }
                    });

                    const yaPercent = answeredCount > 0 ? ((yaCount / answeredCount) * 100).toFixed(1) : '0';
                    const tidakPercent = answeredCount > 0 ? ((tidakCount / answeredCount) * 100).toFixed(1) : '0';

                    // Determine risk level based on prevalence of risk answer
                    let riskLevel = 'low';
                    const riskPercent = config.riskAnswer === 'Ya' ? parseFloat(yaPercent) : parseFloat(tidakPercent);
                    if (riskPercent >= 50) riskLevel = 'high';
                    else if (riskPercent >= 25) riskLevel = 'medium';

                    questions.push({
                        key,
                        label: config.label,
                        riskAnswer: config.riskAnswer,
                        ya: { count: yaCount, percent: parseFloat(yaPercent) },
                        tidak: { count: tidakCount, percent: parseFloat(tidakPercent) },
                        total: answeredCount,
                        riskLevel,
                    });
                });

            sections.push({
                name: section.key,
                icon: section.icon,
                questions,
            });
        });

        return NextResponse.json({
            userRole: appUser?.role || null,
            totalSurveys: surveys.length,
            totalPuskesmas: uniquePuskesmas.size,
            totalDesa: uniqueDesa.size,
            sections,
        });
    } catch (err: any) {
        console.error("[rekap] API error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}
