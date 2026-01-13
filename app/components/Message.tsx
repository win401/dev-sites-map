type MessageProps = {
  message: string;
};

export default function Message({ message }: MessageProps) {
  if (!message) return null;

  return (
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
      {message}
    </div>
  );
}
