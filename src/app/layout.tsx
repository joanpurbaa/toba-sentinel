import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Toba Sentinel",
	description: "MediStock Supply Chain Admin Center",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} h-full`}>
			<body className="font-[family-name:var(--font-geist-sans)] antialiased h-full bg-slate-50 text-slate-900">
				{children}
			</body>
		</html>
	);
}
