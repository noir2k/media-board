import { NextResponse } from "next/server";

import { getBoardData } from "@/lib/board-data";

export async function GET() {
  const payload = await getBoardData();

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "s-maxage=60, stale-while-revalidate=240",
    },
  });
}
