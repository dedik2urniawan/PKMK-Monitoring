"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } finally {
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
