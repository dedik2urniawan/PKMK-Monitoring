import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const balita_id = req.nextUrl.searchParams.get("balita_id");
  if (!balita_id) return new Response("balita_id required", { status: 400 });
  const { data, error } = await supabase
    .from("kohort")
    .select("id, status, periode_mulai, periode_selesai")
    .eq("balita_id", balita_id)
    .order("periode_mulai", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return new Response(error.message, { status: 400 });
  return NextResponse.json({ item: data ?? null });
}

