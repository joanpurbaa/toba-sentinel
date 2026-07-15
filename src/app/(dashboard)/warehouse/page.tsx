import { WarehouseShell } from "@/components/warehouse-shell";

export default function WarehousePage() {
  return (
    <div className="flex flex-col w-full min-h-screen p-4 sm:p-6 space-y-6 bg-slate-50">
      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Visualisasi 3D Gudang</h1>
        <p className="mt-2 text-sm text-slate-500">
          Pantau rak utama, cek stok kritis, dan jelajahi tata letak gudang secara real time.
        </p>
      </div>

      <div className="rounded-[2rem] overflow-hidden">
        <WarehouseShell />
      </div>
    </div>
  );
}
