export { proxy } from "./src/proxy";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/distribusi/:path*",
    "/stok-barang/:path*",
    "/riwayat/:path*",
    "/masuk",
  ],
};