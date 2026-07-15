// SceneWrapper.tsx
import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { useFullscreen } from "@/hooks/useFullscreen";
import { Model } from "../../Warehousecompressed2";

export default function SceneWrapper() {
	const containerRef = useRef<HTMLDivElement>(null);
	const { isFullscreen, toggleFullscreen } = useFullscreen(
		containerRef as React.RefObject<HTMLElement>
	);

	return (
		<div
			ref={containerRef}
			style={{
				position: "relative",
				width: "100%",
				height: "100vh",
				background: "#000",
			}}>
			<Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
				<ambientLight intensity={1} />
				<Model />
			</Canvas>

			<button
				onClick={toggleFullscreen}
				style={{
					position: "absolute",
					bottom: 16,
					right: 16,
					width: 36,
					height: 36,
					background: "rgba(0,0,0,0.6)",
					border: "none",
					borderRadius: 4,
					cursor: "pointer",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}>
				{isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
			</button>
		</div>
	);
}

function FullscreenIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="white">
			<path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
		</svg>
	);
}

function ExitFullscreenIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="white">
			<path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
		</svg>
	);
}
