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
    .select("id, name, slug, min_spend, visits_required, reward_name")
    .eq("slug", params.slug)
    .maybeSingle();

  let resolvedMerchant = merchant;

  // If merchant doesn't exist in Supabase, check known demo presets before 404
  if (!resolvedMerchant) {
    if (params.slug === "kesar-chai") {
      resolvedMerchant = {
        id: "demo-kesar-chai",
        slug: "kesar-chai",
        name: "Kesar Chai Corner",
        min_spend: 100,
        visits_required: 10,
        reward_name: "Free Masala Chai",
      };
    } else if (params.slug === "patel-kirana") {
      resolvedMerchant = {
        id: "demo-patel-kirana",
        slug: "patel-kirana",
        name: "Patel Kirana Superstore",
        min_spend: 250,
        visits_required: 10,
        reward_name: "1L Cooking Oil Pouch",
      };
    } else if (params.slug === "the-bun-co" || params.slug === "burger-joint") {
      resolvedMerchant = {
        id: "demo-burger-joint",
        slug: "the-bun-co",
        name: "The Bun Co. Burgers",
        min_spend: 150,
        visits_required: 7,
        reward_name: "Free Crispy Burger",
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
      }}
    />
  );
}
