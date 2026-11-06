import { NextRequest, NextResponse } from "next/server";
import { approveVisit } from "@/app/actions/scan";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const checkinId = body.checkinId || body.visitId || "";

    if (!checkinId) {
      return NextResponse.json({ success: false, error: "Missing checkinId" }, { status: 400 });
    }

    const res = await approveVisit(checkinId);
    return NextResponse.json(res, { status: res.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "Approval failed" }, { status: 500 });
  }
}
