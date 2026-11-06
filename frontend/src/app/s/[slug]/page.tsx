import React from "react";
import CustomerView from "@/components/CustomerView";
import Link from "next/link";
import { Store, ArrowLeft, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    slug: string;
  };
}

async function getMerchant(slug: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const res = await fetch(`${apiUrl}/api/v1/merchant/slug/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.merchant || json.data || json;
  } catch {
    return null;
  }
}

export default async function ShopSlugPage({ params }: Props) {
  const merchant = await getMerchant(params.slug);

  if (!merchant || !merchant.id) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-sand px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-border bg-white p-8 text-center shadow-card">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-secondary">
            Store Not Found
          </h1>
          <p className="mt-2 text-xs text-ink/70 leading-relaxed">
            The counter pass for <span className="font-mono font-bold text-secondary">/s/{params.slug}</span> is either inactive or has not been configured yet.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-secondary px-5 text-xs font-bold text-white transition hover:bg-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to StickTheBizz Home</span>
            </Link>
            <Link
              href="/customer/dashboard"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-sand/40 px-5 text-xs font-bold text-secondary transition hover:bg-sand"
            >
              <span>Go to My Digital Passes</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (merchant.subscriptionStatus === "INACTIVE" || merchant.subscriptionStatus === "EXPIRED") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-sand px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-border bg-white p-8 text-center shadow-card">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-800">
            <Clock className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-secondary">
            Counter Paused
          </h1>
          <p className="mt-2 text-xs text-ink/70 leading-relaxed">
            The loyalty counter pass for <strong className="text-secondary">{merchant.name}</strong> is currently paused. Please ask the shop manager at the counter to renew their pass.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-secondary px-5 text-xs font-bold text-white transition hover:bg-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to StickTheBizz Home</span>
            </Link>
            <Link
              href="/customer/dashboard"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-sand/40 px-5 text-xs font-bold text-secondary transition hover:bg-sand"
            >
              <span>Go to My Digital Passes</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CustomerView
      initialMerchant={{
        id: merchant.id,
        slug: merchant.slug,
        name: merchant.name,
        minSpend: merchant.minSpend || 100,
        visitsRequired: merchant.visitsRequired || 10,
        rewardName: merchant.rewardName || "Loyalty Reward",
        validityDays: merchant.validityDays || 30,
      }}
      initialCustomer={null}
      initialStatus={null}
    />
  );
}

