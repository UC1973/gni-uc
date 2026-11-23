"use client";

import { useEffect } from "react";

/** 운영 빌드에서만 서비스 워커 등록 (개발 서버 캐시 혼선 방지) */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
