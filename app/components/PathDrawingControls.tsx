type PathDrawingControlsProps = {
  isDrawing: boolean;
  hasPath: boolean;
  onToggleDrawing: () => void;
  onClearPath: () => void;
};

export default function PathDrawingControls({
  isDrawing,
  hasPath,
  onToggleDrawing,
  onClearPath,
}: PathDrawingControlsProps) {
  return (
    <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
      <button
        onClick={onToggleDrawing}
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
        onClick={onClearPath}
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
  );
}
