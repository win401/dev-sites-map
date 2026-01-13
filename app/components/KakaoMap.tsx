"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

export default function KakaoMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!key) {
      console.error("Kakao map key missing");
      return;
    }

    // 이미 로드돼 있으면 재사용
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(initMap);
      return;
    }

    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(initMap);
    document.head.appendChild(script);

    function initMap() {
      if (!mapRef.current) return;

      const center = new window.kakao.maps.LatLng(37.5665, 126.978); // 서울시청
      new window.kakao.maps.Map(mapRef.current, {
        center,
        level: 6,
      });
    }
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "70vh",
        border: "1px solid #ddd",
        borderRadius: 12,
      }}
    />
  );
}
