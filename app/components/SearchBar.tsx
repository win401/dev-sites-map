type SearchBarProps = {
  keyword: string;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
};

export default function SearchBar({
  keyword,
  onKeywordChange,
  onSearch,
}: SearchBarProps) {
  return (
    <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
      <input
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSearch();
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
        onClick={onSearch}
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
  );
}
