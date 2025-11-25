'use client'

// Dengan cookie-based auth Supabase (@supabase/ssr), token sudah otomatis
// dikirim via cookie. Helper ini dibiarkan ringan agar pemanggil lama tetap jalan.

export function persistClientTokens() {}
export function clearClientTokens() {}

export async function syncServerSession() {
  // Tidak perlu sinkronisasi manual; cookie sudah dikirim otomatis.
  return true
}

export async function ensureServerSession() {
  return true
}

export async function getAuthHeaders() {
  // Header Authorization tidak diperlukan; fetch bawakan cookie
  return {}
}
