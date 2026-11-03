import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CustomerView from "@/components/CustomerView";

interface Props {
  params: {
    slug: string;
  };
}

export default async function ShopSlugPage({ params }: Props) {
  const supabase = createClient();
  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, name, slug, min_spend, visits_required, reward_name, validity_days")
    .eq("slug", params.slug)
    .maybeSingle();

  let resolvedMerchant = merchant;

  // Fallback to verified seed presets if merchant is in setup phase
  if (!resolvedMerchant) {
    if (params.slug === "kesar-chai") {
      resolvedMerchant = {
        id: "5cc30c25-3711-4b65-891b-13af808a556f",
        slug: "kesar-chai",
        name: "Kesar Chai Corner",
        min_spend: 100,
        visits_required: 10,
        reward_name: "Free Masala Chai",
        validity_days: 30,
      };
    } else if (params.slug === "patel-kirana") {
      resolvedMerchant = {
        id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12",
        slug: "patel-kirana",
        name: "Patel Kirana Superstore",
        min_spend: 250,
        visits_required: 10,
        reward_name: "1L Cooking Oil Pouch",
        validity_days: 30,
      };
    } else if (params.slug === "the-bun-co" || params.slug === "burger-joint") {
      resolvedMerchant = {
        id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13",
        slug: "the-bun-co",
        name: "The Bun Co. Burgers",
        min_spend: 150,
        visits_required: 7,
        reward_name: "Free Crispy Burger",
        validity_days: 30,
      };
    } else {
      notFound();
    }
  }

  return (
    <CustomerView
      initialMerchant={{
        id: resolvedMerchant.id,
        slug: resolvedMerchant.slug,
        name: resolvedMerchant.name,
        minSpend: resolvedMerchant.min_spend,
        visitsRequired: resolvedMerchant.visits_required,
        rewardName: resolvedMerchant.reward_name,
        validityDays: resolvedMerchant.validity_days || 30,
      }}
    />
  );
}
