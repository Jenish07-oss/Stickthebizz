import { NextRequest, NextResponse } from "next/server";
import { rejectVisit } from "@/app/actions/scan";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const checkinId = body.checkinId || body.visitId || "";
    const reason = body.reason || "Declined by merchant";

    if (!checkinId) {
      return NextResponse.json({ success: false, error: "Missing checkinId" }, { status: 400 });
    }

    const res = await rejectVisit(checkinId);
    return NextResponse.json(res, { status: res.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Rejection failed" }, { status: 500 });
  }
}
