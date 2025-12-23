"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { clearClientTokens } from "@/lib/clientSession";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    try {
      setLoading(true);
      // Clear session storage agar welcome modal muncul lagi saat login berikutnya
      sessionStorage.removeItem("pkmk_welcome_shown");
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } finally {
      clearClientTokens();
      setLoading(false);
      window.location.href = "/login";
    }
  }

  return (
    <button
      onClick={onLogout}
      disabled={loading}
      className="rounded-lg bg-[var(--primary-600)] text-white px-3 py-1.5 text-sm hover:bg-[var(--primary-700)] disabled:opacity-60"
      aria-label="Keluar"
    >
      {loading ? "Keluar..." : "Keluar"}
    </button>
  );
}
