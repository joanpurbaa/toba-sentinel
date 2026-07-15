"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
	LockIcon,
	UserIcon,
	EyeIcon,
	EyeOffIcon,
	ShieldCheckIcon,
	ActivityIcon,
	TruckIcon,
} from "lucide-react";
import Image from "next/image";

interface UserPayload {
	id: string;
	name: string;
	email: string;
	role: "ADMIN" | "DRIVER" | "STAFF";
}

interface LoginResponse {
	success?: boolean;
	error?: string;
	user?: UserPayload;
}

export default function Masuk() {
	const router = useRouter();
	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>("");

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);
		setErrorMessage("");

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = (await response.json().catch(() => ({}))) as LoginResponse;

			if (!response.ok || !data.success) {
				throw new Error(data.error || "Login gagal. Silakan coba lagi.");
			}

			if (data.user?.role === "DRIVER") {
				router.replace("/driver");
			} else {
				router.replace("/dashboard");
			}

			router.refresh();
		} catch (error: unknown) {
			setErrorMessage(
				error instanceof Error ? error.message : "Terjadi kesalahan sistem.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen w-full flex bg-white">
			<div className="w-full lg:w-4xl flex flex-col justify-between p-6 sm:p-10 bg-white z-10">
				<div className="flex items-center gap-2.5">
					<Image
						width="28"
						height="28"
						src="/icon.svg"
						alt="icon"
						className="w-7 h-7"
					/>
					<span className="text-base font-bold text-secondary tracking-tight">
						pharmasync
					</span>
				</div>

				<div className="w-full max-w-sm mx-auto my-auto py-10">
					<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold tracking-wide mb-5">
						<ShieldCheckIcon className="w-3 h-3" />
						PORTAL INTERNAL
					</div>

					<div className="space-y-2 mb-8">
						<h1 className="text-2xl font-bold text-slate-900 tracking-tight">
							Selamat Datang Kembali
						</h1>
						<p className="text-sm text-slate-500">
							Silakan masuk ke panel manajemen supply chain farmasi Anda.
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-1.5">
							<label className="text-xs font-semibold tracking-wide text-slate-700 block">
								Alamat Email
							</label>
							<div className="relative">
								<UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
								<input
									type="email"
									required
									placeholder="nama@perusahaan.com"
									value={email}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										setEmail(e.target.value)
									}
									className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-400 transition-all text-slate-800 font-medium shadow-sm"
								/>
							</div>
						</div>

						<div className="space-y-1.5">
							<label className="text-xs font-semibold tracking-wide text-slate-700 block">
								Kata Sandi
							</label>
							<div className="relative">
								<LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
								<input
									type={showPassword ? "text" : "password"}
									required
									placeholder="••••••••"
									value={password}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										setPassword(e.target.value)
									}
									className="w-full pl-9 pr-10 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-400 transition-all text-slate-800 font-medium shadow-sm"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
									tabIndex={-1}>
									{showPassword ? (
										<EyeOffIcon className="w-4 h-4" />
									) : (
										<EyeIcon className="w-4 h-4" />
									)}
								</button>
							</div>
						</div>

						{errorMessage ? (
							<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600 font-medium flex gap-2 items-start">
								<span>⚠️</span>
								<span>{errorMessage}</span>
							</div>
						) : null}

						<button
							type="submit"
							disabled={isLoading}
							className="w-full mt-2 inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 cursor-pointer rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed">
							{isLoading ? (
								<div className="flex items-center gap-2">
									<svg
										className="animate-spin h-4 w-4 text-white"
										fill="none"
										viewBox="0 0 24 24">
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									<span>Memverifikasi...</span>
								</div>
							) : (
								"Masuk ke Dashboard"
							)}
						</button>
					</form>
				</div>

				<div className="text-center lg:text-left">
					<p className="text-[11px] font-medium text-slate-400 tracking-wide">
						Pharmasync &copy; {new Date().getFullYear()} &bull; Supply Chain
						Management System
					</p>
				</div>
			</div>

			<div className="hidden lg:flex flex-1 bg-secondary relative items-end justify-center overflow-hidden">
				<div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#FFF_1px,transparent_1px)] [background-size:18px_18px]"></div>

				<div className="absolute top-10 left-10 right-10 space-y-4 z-10">
					<div className="flex gap-2">
						<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-[11px] font-bold">
							<ActivityIcon className="w-3 h-3" />
							Real-time
						</span>
						<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-white text-[11px] font-bold">
							<TruckIcon className="w-3 h-3" />
							Tracking Armada
						</span>
					</div>
					<h2 className="text-3xl font-bold text-white tracking-tight leading-tight max-w-sm">
						Kelola Rantai Pasok Farmasi Anda
					</h2>
					<p className="text-sm text-slate-300 leading-relaxed max-w-sm">
						Pantau stok, distribusi, dan armada kurir secara terpusat dan aman dalam
						satu dashboard.
					</p>
				</div>

				<div className="relative w-full max-w-xl h-[85%] mt-20">
					<Image
						src="/man.webp"
						alt="Petugas lapangan Pharmasync"
						fill
						className="object-cover object-top"
						priority
					/>
					<div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-secondary to-transparent"></div>
				</div>
			</div>
		</div>
	);
}
