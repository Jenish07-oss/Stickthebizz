import { createClient } from "@/lib/supabase/server";
import CustomerView from "@/components/CustomerView";
import Link from "next/link";
import { Store, ArrowLeft } from "lucide-react";
import { getCustomerMerchantStatus } from "@/app/actions/scan";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    slug: string;
  };
}

export default async function ShopSlugPage({ params }: Props) {
  const supabase = await createClient();

  // 1. Resolve merchant dynamically from DB (zero hardcoded seeds)
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, name, slug, min_spend, visits_required, reward_name, validity_days")
    .eq("slug", params.slug)
    .maybeSingle();

  if (!merchant) {
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

  // 2. Auto-Login: Detect customer from server session cookies
  const { data: { user } } = await supabase.auth.getUser();
  let initialCustomer: { id?: string; phone: string; fullName?: string | null; email?: string | null } | null = null;
  let initialStatus: { visitsCount: number; isLockedToday: boolean } | null = null;

  if (user) {
    const userPhone = (user.phone || user.user_metadata?.phone || "").replace(/\D/g, "");
    const userEmail = user.email || "";

    const { data: customerRow } = await supabase
      .from("customers")
      .select("id, phone, full_name, email")
      .or(`email.eq.${userEmail},phone.eq.${userPhone}`)
      .maybeSingle();

    if (customerRow) {
      initialCustomer = {
        id: customerRow.id,
        phone: customerRow.phone,
        fullName: customerRow.full_name,
        email: customerRow.email,
      };
    } else if (userPhone) {
      initialCustomer = {
        phone: userPhone,
        fullName: user.user_metadata?.full_name || null,
        email: userEmail,
      };
    }

    if (initialCustomer?.phone && merchant) {
      const status = await getCustomerMerchantStatus(merchant.id, initialCustomer.phone);
      if (status) {
        initialStatus = {
          visitsCount: status.visitsCount || 0,
          isLockedToday: status.isLockedToday || false,
        };
      }
    }
  }

  return (
    <CustomerView
      initialMerchant={{
        id: merchant.id,
        slug: merchant.slug,
        name: merchant.name,
        minSpend: merchant.min_spend,
        visitsRequired: merchant.visits_required,
        rewardName: merchant.reward_name,
        validityDays: merchant.validity_days || 30,
      }}
      initialCustomer={initialCustomer}
      initialStatus={initialStatus}
    />
  );
}
