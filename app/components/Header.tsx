export default function Header() {
  return (
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
  );
}
