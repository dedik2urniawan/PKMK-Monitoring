import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

// Calculate risk score based on answers
function calculateRiskScore(data: any): { score: number; category: string } {
    let score = 0;

    // Section 2-6 risk calculation (same as in route.ts)
    if (data.q2_1_lbw === 'Ya') score++;
    if (data.q2_2_hf_delivery === 'Tidak') score++;
    if (data.q2_3_anc4 === 'Tidak') score++;
    if (data.q2_4_mat_height_low === 'Ya') score++;
    if (data.q2_5_mat_underweight === 'Ya') score++;
    if (data.q2_6_low_mat_edu === 'Ya') score++;
    if (data.q3_1_ebf === 'Tidak') score++;
    if (data.q3_2_cf_6m === 'Tidak') score++;
    if (data.q3_3_current_bf === 'Tidak') score++;
    if (data.q3_4_min_meal_freq === 'Tidak') score++;
    if (data.q3_5_mdd === 'Tidak') score++;
    if (data.q4_1_diarrhea === 'Ya') score++;
    if (data.q4_1a_recurrent_diarrhea === 'Ya') score++;
    if (data.q4_2_ari === 'Ya') score++;
    if (data.q4_3_fever === 'Ya') score++;
    if (data.q4_4_helminth === 'Ya') score++;
    if (data.q5_1_safe_water === 'Tidak') score++;
    if (data.q5_2_water_treat === 'Tidak') score++;
    if (data.q5_3_improved_san === 'Tidak') score++;
    if (data.q5_4_hwws === 'Tidak') score++;
    if (data.q5_5_overcrowd === 'Ya') score++;
    if (data.q5_6_multi_u5 === 'Ya') score++;
    if (data.q5_7_low_ses === 'Ya') score++;
    if (data.q5_8_female_hhh === 'Ya') score++;
    if (data.q6_1_non_mat_care === 'Ya') score++;
    if (data.q6_2_child_not_priority === 'Ya') score++;

    let category = 'Rendah';
    if (score >= 17) category = 'Tinggi';
    else if (score >= 9) category = 'Sedang';

    return { score, category };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('survey_determinan')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ item: data });
    } catch (error) {
        console.error('[survey GET] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const appUser = await getAppUser();

        if (!appUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { score, category } = calculateRiskScore(body);

        const updateData = {
            ...body,
            risk_score: score,
            risk_category: category,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('survey_determinan')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ item: data });
    } catch (error) {
        console.error('[survey PUT] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const appUser = await getAppUser();

        if (!appUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { error } = await supabase
            .from('survey_determinan')
            .delete()
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[survey DELETE] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
