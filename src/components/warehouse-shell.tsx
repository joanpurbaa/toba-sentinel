"use client";

import dynamic from "next/dynamic";

const WarehouseView = dynamic(
  () => import("@/components/warehouse-view").then((mod) => mod.WarehouseView),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="rounded-3xl border border-slate-200/10 bg-slate-950/70 p-6 text-slate-200">
          <p className="text-sm font-medium">Memuat tampilan 3D...</p>
        </div>
      </div>
    ),
  }
);

export function WarehouseShell() {
  return <WarehouseView/>;
}
