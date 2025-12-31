import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// API endpoint to get current user info (role, puskesmas) for client-side use
export async function GET(req: NextRequest) {
    try {
        // Get Authorization header
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
            return NextResponse.json({ error: 'No auth token' }, { status: 401 });
        }

        const jwt = authHeader.slice(7).trim();
        if (!jwt) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Decode JWT to get user info
        const parts = jwt.split('.');
        if (parts.length !== 3) {
            return NextResponse.json({ error: 'Invalid token format' }, { status: 401 });
        }

        // Decode payload
        const payload = parts[1];
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
        const decoded = JSON.parse(jsonPayload);

        // Check expiration
        if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
            return NextResponse.json({ error: 'Token expired' }, { status: 401 });
        }

        const userId = decoded.sub;
        const userEmail = decoded.email;

        if (!userId) {
            return NextResponse.json({ error: 'No user ID in token' }, { status: 401 });
        }

        // Lookup user in app_users table
        const supabase = await createClient();

        // Try by ID first
        let { data, error } = await supabase
            .from('app_users')
            .select('id, email, role, puskesmas_id')
            .eq('id', userId)
            .maybeSingle();

        // Fallback to email
        if (!data && userEmail) {
            const r2 = await supabase
                .from('app_users')
                .select('id, email, role, puskesmas_id')
                .eq('email', userEmail)
                .maybeSingle();
            data = r2.data;
        }

        if (!data) {
            return NextResponse.json({
                id: userId,
                email: userEmail,
                role: 'user', // Default fallback
                puskesmas_id: null
            });
        }

        // Get puskesmas name if available
        let puskesmasName = null;
        if (data.puskesmas_id) {
            const { data: pkm } = await supabase
                .from('ref_puskesmas')
                .select('nama')
                .eq('id', data.puskesmas_id)
                .single();
            puskesmasName = pkm?.nama || null;
        }

        return NextResponse.json({
            id: data.id,
            email: data.email,
            role: data.role,
            puskesmas_id: data.puskesmas_id,
            puskesmas_name: puskesmasName
        });

    } catch (error: any) {
        console.error('[/api/auth/me] Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
