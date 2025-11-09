"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function BalitaActions({ id, nik, onDeleted }: { id?: string | null; nik?: string | null; onDeleted?: () => void }) {
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (loading) return;
    if (!confirm("Hapus balita ini? Tindakan tidak bisa dibatalkan.")) return;
    setLoading(true);
    const res = await fetch(`/api/balita/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id ?? undefined, nik: nik ?? undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error(await res.text());
      return;
    }
    toast.success("Hapus berhasil");
    onDeleted ? onDeleted() : undefined;
  }

  return (
    <button onClick={onDelete} disabled={loading} className="px-2 py-1 rounded border border-[var(--border)] bg-white hover:bg-red-50 text-[13px] text-red-700 disabled:opacity-60">
      {loading ? "Menghapus..." : "Hapus"}
    </button>
  );
}
