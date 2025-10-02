"use client";

declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
  }
}

if (typeof window !== "undefined") {
  window.CESIUM_BASE_URL = "/cesium";
}
// @ts-ignore
import "cesium/Build/Cesium/Widgets/widgets.css";

export default function CesiumSetup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
