import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const shopId = req.nextUrl.searchParams.get("shopId") || "";
  const token = req.nextUrl.searchParams.get("token") || "";

  return NextResponse.json({
    status: "Terminal Online",
    connected: true,
    protocol: "supabase-realtime-broadcast",
    channel: `merchant:${shopId || "terminal"}`,
    chimeUrl: "/sounds/chime.mp3",
    timestamp: new Date().toISOString(),
  });
}
