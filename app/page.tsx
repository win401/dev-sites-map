export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Env check</h1>
      <p>
        {process.env.DATABASE_URL ? "DATABASE_URL OK" : "DATABASE_URL MISSING"}
      </p>
    </main>
  );
}
