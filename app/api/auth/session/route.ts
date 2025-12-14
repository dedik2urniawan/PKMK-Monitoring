import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/appUser";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET - Return current user session data
export async function GET(req: NextRequest) {
  try {
    const user = await getAppUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        puskesmas_id: user.puskesmas_id
      }
    });
  } catch (error) {
    console.error('[API /auth/session GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Set session from tokens (existing functionality)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json().catch(() => ({} as any));
  const access_token = body?.access_token;
  const refresh_token = body?.refresh_token;

  if (!access_token || !refresh_token) {
    console.error('Session sync failed: missing tokens');
    return new Response("access_token dan refresh_token wajib", { status: 400 });
  }

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });

  if (error) {
    console.error('Supabase setSession error:', error.message);
    return new Response(error.message, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
