import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

// Calculate risk score based on answers
function calculateRiskScore(data: any): { score: number; category: string } {
    let score = 0;

    // Section 2: Riwayat Kelahiran & Ibu (risk if "Ya")
    if (data.q2_1_lbw === 'Ya') score++;
    if (data.q2_2_hf_delivery === 'Tidak') score++; // Risk if NOT at health facility
    if (data.q2_3_anc4 === 'Tidak') score++; // Risk if less than 4 visits
    if (data.q2_4_mat_height_low === 'Ya') score++;
    if (data.q2_5_mat_underweight === 'Ya') score++;
    if (data.q2_6_low_mat_edu === 'Ya') score++;

    // Section 3: IYCF (risk if "Tidak" for positive behaviors)
    if (data.q3_1_ebf === 'Tidak') score++;
    if (data.q3_2_cf_6m === 'Tidak') score++;
    if (data.q3_3_current_bf === 'Tidak') score++;
    if (data.q3_4_min_meal_freq === 'Tidak') score++;
    if (data.q3_5_mdd === 'Tidak') score++;

    // Section 4: Infections (risk if "Ya")
    if (data.q4_1_diarrhea === 'Ya') score++;
    if (data.q4_1a_recurrent_diarrhea === 'Ya') score++;
    if (data.q4_2_ari === 'Ya') score++;
    if (data.q4_3_fever === 'Ya') score++;
    if (data.q4_4_helminth === 'Ya') score++;

    // Section 5: WASH (risk if "Tidak" for positive, "Ya" for negative)
    if (data.q5_1_safe_water === 'Tidak') score++;
    if (data.q5_2_water_treat === 'Tidak') score++;
    if (data.q5_3_improved_san === 'Tidak') score++;
    if (data.q5_4_hwws === 'Tidak') score++;
    if (data.q5_5_overcrowd === 'Ya') score++;
    if (data.q5_6_multi_u5 === 'Ya') score++;
    if (data.q5_7_low_ses === 'Ya') score++;
    if (data.q5_8_female_hhh === 'Ya') score++;

    // Section 6: Parenting (risk if "Ya")
    if (data.q6_1_non_mat_care === 'Ya') score++;
    if (data.q6_2_child_not_priority === 'Ya') score++;

    // Determine category
    let category = 'Rendah';
    if (score >= 17) category = 'Tinggi';
    else if (score >= 9) category = 'Sedang';

    return { score, category };
}

export async function GET(request: NextRequest) {
    try {
        const supabase = createAdminClient(); // Use admin client to bypass RLS
        const appUser = await getAppUser();

        const { searchParams } = new URL(request.url);
        const balita_id = searchParams.get('balita_id');

        if (!balita_id) {
            return NextResponse.json({ error: 'balita_id required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('survey_determinan')
            .select('*')
            .eq('balita_id', balita_id)
            .order('tanggal_survey', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ items: data || [] });
    } catch (error) {
        console.error('[survey GET] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = createAdminClient(); // Use admin client to bypass RLS
        const appUser = await getAppUser();

        if (!appUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Calculate risk score
        const { score, category } = calculateRiskScore(body);

        const insertData = {
            ...body,
            surveyor_id: appUser.id,
            risk_score: score,
            risk_category: category,
        };

        const { data, error } = await supabase
            .from('survey_determinan')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error('[survey POST] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ item: data });
    } catch (error) {
        console.error('[survey POST] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
