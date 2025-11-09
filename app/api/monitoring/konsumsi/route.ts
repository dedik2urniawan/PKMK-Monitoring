import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  if (!body?.kohort_id || !body?.minggu_ke || !body?.tanggal) {
    return new Response("Data kurang", { status: 400 });
  }
  const { error } = await supabase.from("monitoring_pkmk_konsumsi").insert({
    kohort_id: body.kohort_id,
    minggu_ke: body.minggu_ke,
    tanggal: body.tanggal,
    kepatuhan_pct: body.kepatuhan_pct ?? null,
    catatan: body.catatan ?? null,
  });
  if (error) return new Response(error.message, { status: 400 });
  return new Response("OK");
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const kohort_id = req.nextUrl.searchParams.get("kohort_id");
  if (!kohort_id) return new Response("kohort_id required", { status: 400 });
  const { data, error } = await supabase
    .from("monitoring_pkmk_konsumsi")
    .select("id, minggu_ke, tanggal, kepatuhan_pct, catatan")
    .eq("kohort_id", kohort_id)
    .order("minggu_ke", { ascending: false })
    .order("tanggal", { ascending: false });
  if (error) return new Response(error.message, { status: 400 });
  return NextResponse.json({ items: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { id, ...fields } = body || {};
  if (!id) return new Response("id required", { status: 400 });
  const { error } = await supabase
    .from("monitoring_pkmk_konsumsi")
    .update({
      minggu_ke: fields.minggu_ke,
      tanggal: fields.tanggal,
      kepatuhan_pct: fields.kepatuhan_pct ?? null,
      catatan: fields.catatan ?? null,
    })
    .eq("id", id);
  if (error) return new Response(error.message, { status: 400 });
  return new Response("OK");
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  // Support body JSON { id } or query ?id=
  let id: string | null = null;
  try {
    const b = await req.json();
    id = b?.id ?? null;
  } catch {}
  if (!id) id = req.nextUrl.searchParams.get("id");
  if (!id) return new Response("id required", { status: 400 });
  const { error } = await supabase.from("monitoring_pkmk_konsumsi").delete().eq("id", id);
  if (error) return new Response(error.message, { status: 400 });
  return new Response("OK");
}
