"use client";
import { useEffect, useRef } from "react";
import { syncServerSession } from "@/lib/clientSession";

export default function AuthSessionSync() {
  const onceRef = useRef(false);
  useEffect(() => {
    if (onceRef.current) return; // avoid double in strict mode
    onceRef.current = true;
    syncServerSession();
  }, []);
  return null;
}
