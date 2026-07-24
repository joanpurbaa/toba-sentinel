"use client";

import dynamic from "next/dynamic";

const JalanMap = dynamic(() => import("@/components/JalanMap"), {
	ssr: false,
	loading: () => (
		<div className="flex items-center justify-center h-full py-20 text-sm text-muted-foreground">
			Memuat peta...
		</div>
	),
});

export default function JalanPage() {
	return <JalanMap />;
}
