"use client";

import { useEffect, useRef, useState, useCallback } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

type Site = {
  id: string;
  name: string;
  lng: number;
  lat: number;
  status?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
  address?: string;
  source?: string;
};

export default function KakaoMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapObjRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const infowindowsRef = useRef<Map<string, any>>(new Map());
  const [msg, setMsg] = useState<string>("");
  const [keyword, setKeyword] = useState("");
  const syncSitesRef = useRef<(() => Promise<void>) | null>(null);

  // 경로 그리기 관련
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasPath, setHasPath] = useState(false);
  const isDrawingRef = useRef(false);
  const pathCoordsRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  // ✅ 장소 검색 → 지도 이동 → 주변 개발 공사 위치 자동 표시
  const searchPlace = useCallback(() => {
    if (!keyword.trim()) return;

    const map = mapObjRef.current;
    if (!map || !window.kakao?.maps?.services) return;

    const ps = new window.kakao.maps.services.Places();

    ps.keywordSearch(keyword, (data: any[], status: string) => {
      if (status !== window.kakao.maps.services.Status.OK) {
        setMsg("검색 결과 없음");
        return;
      }

      const place = data[0]; // 첫 결과
      const lat = Number(place.y);
      const lng = Number(place.x);

      const moveLatLng = new window.kakao.maps.LatLng(lat, lng);
      map.setCenter(moveLatLng);
      map.setLevel(5); // 적당히 확대

      // 지도 이동 후 주변 개발 공사 위치 자동 표시
      setTimeout(() => {
        if (syncSitesRef.current) {
          syncSitesRef.current();
        }
      }, 300);
    });
  }, [keyword]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

    if (!key) {
      setMsg("NEXT_PUBLIC_KAKAO_MAP_KEY가 비어있음 (.env.local 확인)");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        if (!mapRef.current) return;

        const center = new window.kakao.maps.LatLng(37.5665, 126.978);
        const map = new window.kakao.maps.Map(mapRef.current, {
          center,
          level: 6,
        });
        mapObjRef.current = map;

        // ✅ bbox로 sites 불러오고 마커 동기화
        let timer: any = null;

        const syncSites = async () => {
          if (!mapObjRef.current) return;

          setMsg("개발 공사 위치 불러오는 중...");

          const bounds = map.getBounds();
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();

          const qs = new URLSearchParams({
            minLng: String(sw.getLng()),
            minLat: String(sw.getLat()),
            maxLng: String(ne.getLng()),
            maxLat: String(ne.getLat()),
          });

          const res = await fetch(`/api/sites?${qs.toString()}`);
          const json = await res.json();

          if (!json.ok) {
            setMsg(`sites API 실패: ${json.error ?? "unknown"}`);
            return;
          }

          const sites: Site[] = json.sites;
          setMsg(`주변 개발 공사 위치 ${sites.length}개 발견`);

          const nextIds = new Set(sites.map((s) => s.id));

          // 화면 밖으로 나간 마커 및 인포윈도우 제거
          for (const [id, marker] of markersRef.current.entries()) {
            if (!nextIds.has(id)) {
              marker.setMap(null);
              markersRef.current.delete(id);

              // 인포윈도우도 제거
              const infowindow = infowindowsRef.current.get(id);
              if (infowindow) {
                infowindow.close();
                infowindowsRef.current.delete(id);
              }
            }
          }

          // 새 마커 추가
          for (const s of sites) {
            if (markersRef.current.has(s.id)) continue;

            const marker = new window.kakao.maps.Marker({
              position: new window.kakao.maps.LatLng(s.lat, s.lng),
              title: s.name,
            });

            marker.setMap(map);
            markersRef.current.set(s.id, marker);

            // 인포윈도우 생성
            const content = `
              <div style="padding: 12px; min-width: 200px; font-family: sans-serif;">
                <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #333;">
                  ${s.name || "이름 없음"}
                </div>
                ${
                  s.status
                    ? `<div style="font-size: 12px; color: #666; margin-bottom: 4px;">상태: ${s.status}</div>`
                    : ""
                }
                ${
                  s.type
                    ? `<div style="font-size: 12px; color: #666; margin-bottom: 4px;">유형: ${s.type}</div>`
                    : ""
                }
                ${
                  s.address
                    ? `<div style="font-size: 12px; color: #666; margin-bottom: 4px;">주소: ${s.address}</div>`
                    : ""
                }
                ${
                  s.start_date || s.end_date
                    ? `<div style="font-size: 12px; color: #666; margin-bottom: 4px;">
                    기간: ${s.start_date || "미정"} ~ ${s.end_date || "미정"}
                  </div>`
                    : ""
                }
                ${
                  s.source
                    ? `<div style="font-size: 11px; color: #999; margin-top: 8px;">출처: ${s.source}</div>`
                    : ""
                }
              </div>
            `;

            const infowindow = new window.kakao.maps.InfoWindow({
              content,
              removable: true,
            });

            infowindowsRef.current.set(s.id, infowindow);

            // 마커 클릭시 인포윈도우 표시
            window.kakao.maps.event.addListener(marker, "click", () => {
              // 다른 인포윈도우 닫기
              infowindowsRef.current.forEach((iw) => iw.close());

              // 클릭한 마커의 인포윈도우 열기
              infowindow.open(map, marker);
            });
          }
        };

        // syncSites를 ref에 저장하여 검색 후 호출 가능하도록
        syncSitesRef.current = syncSites;

        // ✅ 디바운스: 드래그/줌 연속 호출 방지
        const scheduleSync = () => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(syncSites, 250);
        };

        // 초기 1회
        syncSites();

        // 지도 움직임/줌 변경 시 자동 갱신
        window.kakao.maps.event.addListener(map, "dragend", scheduleSync);
        window.kakao.maps.event.addListener(map, "zoom_changed", scheduleSync);

        // ✅ 경로 그리기: 지도 클릭 이벤트
        const handleMapClick = (mouseEvent: any) => {
          if (!isDrawingRef.current) return;

          const latlng = mouseEvent.latLng;
          pathCoordsRef.current.push(latlng);

          // Polyline 갱신
          if (polylineRef.current) {
            polylineRef.current.setMap(null);
          }

          if (pathCoordsRef.current.length > 0) {
            polylineRef.current = new window.kakao.maps.Polyline({
              path: pathCoordsRef.current,
              strokeWeight: 3,
              strokeColor: "#FF0000",
              strokeOpacity: 0.8,
              strokeStyle: "solid",
            });
            polylineRef.current.setMap(map);
            setHasPath(true);
          }
        };

        // ✅ 경로 그리기: 더블클릭으로 종료
        const handleMapDblClick = () => {
          if (isDrawingRef.current) {
            isDrawingRef.current = false;
            setIsDrawing(false);
            setMsg("경로 그리기 종료");
          }
        };

        window.kakao.maps.event.addListener(map, "click", handleMapClick);
        window.kakao.maps.event.addListener(map, "dblclick", handleMapDblClick);
      });
    };

    script.onerror = () => {
      setMsg("SDK load failed (키/도메인/차단 확인 필요)");
    };

    document.head.appendChild(script);

    return () => {
      for (const marker of markersRef.current.values()) marker.setMap(null);
      markersRef.current.clear();

      for (const infowindow of infowindowsRef.current.values())
        infowindow.close();
      infowindowsRef.current.clear();

      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      pathCoordsRef.current = [];
    };
  }, []);

  return (
    <div style={{ padding: 16, maxWidth: "1400px", margin: "0 auto" }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 16 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 4,
            color: "#333",
          }}
        >
          개발 공사 위치 지도
        </h1>
        <p style={{ fontSize: 14, color: "#666" }}>
          지역을 검색하면 주변의 현재 개발 공사중인 위치를 자동으로 표시합니다
        </p>
      </div>

      {/* 검색 UI */}
      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              searchPlace();
            }
          }}
          placeholder="지역 검색 (예: 서울 강남구, 부산 해운대구)"
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid #ddd",
            borderRadius: 8,
            fontSize: 14,
          }}
        />
        <button
          onClick={searchPlace}
          style={{
            padding: "10px 20px",
            backgroundColor: "#3182f6",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          검색
        </button>
      </div>

      {/* 경로 그리기 UI */}
      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        <button
          onClick={() => {
            const newState = !isDrawing;
            isDrawingRef.current = newState;
            setIsDrawing(newState);
            setMsg(
              newState
                ? "경로 그리기 모드: 지도를 클릭하여 경로를 그리세요 (더블클릭으로 종료)"
                : "경로 그리기 종료"
            );
          }}
          style={{
            padding: "10px 20px",
            backgroundColor: isDrawing ? "#ef4444" : "#10b981",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {isDrawing ? "그리기 종료" : "그리기 시작"}
        </button>
        <button
          onClick={() => {
            if (polylineRef.current) {
              polylineRef.current.setMap(null);
              polylineRef.current = null;
            }
            pathCoordsRef.current = [];
            setHasPath(false);
            setMsg("경로 초기화 완료");
          }}
          disabled={!hasPath}
          style={{
            padding: "10px 20px",
            backgroundColor: hasPath ? "#6b7280" : "#d1d5db",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: hasPath ? "pointer" : "not-allowed",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          초기화
        </button>
      </div>

      {msg && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 12px",
            backgroundColor: "#f0f9ff",
            border: "1px solid #bae6fd",
            borderRadius: 6,
            fontSize: 13,
            color: "#0369a1",
          }}
        >
          {msg}
        </div>
      )}

      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "70vh",
          border: "1px solid #ddd",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      />
    </div>
  );
}
