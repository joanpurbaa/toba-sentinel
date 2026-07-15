"use client";

import { useState, useEffect, useCallback, RefObject } from "react";

export function useFullscreen(ref: RefObject<HTMLElement>) {
	const [isFullscreen, setIsFullscreen] = useState(false);

	useEffect(() => {
		const handleChange = () => {
			setIsFullscreen(document.fullscreenElement === ref.current);
		};
		document.addEventListener("fullscreenchange", handleChange);
		return () => document.removeEventListener("fullscreenchange", handleChange);
	}, [ref]);

	const toggleFullscreen = useCallback(() => {
		if (!document.fullscreenElement) {
			ref.current?.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
	}, [ref]);

	return { isFullscreen, toggleFullscreen };
}
