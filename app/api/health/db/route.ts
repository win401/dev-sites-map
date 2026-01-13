import { NextResponse } from "next/server";
import postgres from "postgres";

export const runtime = "nodejs";

function num(v: string | null) {
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const minLng = num(searchParams.get("minLng"));
  const minLat = num(searchParams.get("minLat"));
  const maxLng = num(searchParams.get("maxLng"));
  const maxLat = num(searchParams.get("maxLat"));

  if (
    minLng === null ||
    minLat === null ||
    maxLng === null ||
    maxLat === null
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing/invalid params. Use ?minLng=...&minLat=...&maxLng=...&maxLat=...",
      },
      { status: 400 }
    );
  }

  if (minLng >= maxLng || minLat >= maxLat) {
    return NextResponse.json(
      { ok: false, error: "Invalid bbox range" },
      { status: 400 }
    );
  }

  const sql = postgres(process.env.DATABASE_URL!, { ssl: "require" });

  try {
    const rows = await sql`
      select
        id, name, status, type, start_date, end_date, address, source,
        ST_X(geom)::float8 as lng,
        ST_Y(geom)::float8 as lat
      from sites
      where geom is not null
        and ST_Intersects(
          geom,
          ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)
        )
      order by updated_at desc
      limit 500;
    `;

    return NextResponse.json({ ok: true, count: rows.length, sites: rows });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 }
    );
  } finally {
    await sql.end({ timeout: 2 });
  }
}
