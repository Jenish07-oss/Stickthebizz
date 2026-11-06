import { NextRequest, NextResponse } from "next/server";
import { validatePromoCode } from "@/lib/pricing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = body.code || body.promoCode || "";
    const planId = body.planId || "MONTHLY";

    const result = validatePromoCode(code, planId);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        totalPayable: 749,
        discount: 0,
        message: err.message || "Failed to validate promo code",
        isFreeActivation: false,
        amountPaise: 74900,
      },
      { status: 500 }
    );
  }
}

