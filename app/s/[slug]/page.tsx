"use client";

import React, { useEffect } from "react";
import CustomerPage from "@/app/customer/page";
import { useStore, CATEGORY_PRESETS, CategoryPreset } from "@/context/StoreContext";

export default function ShopSlugPage({ params }: { params: { slug: string } }) {
  const { setCategory, updateRule } = useStore();

  useEffect(() => {
    const slug = params.slug;
    if (slug === "patel-kirana") {
      setCategory("kirana");
    } else if (slug === "burger-joint") {
      setCategory("burger");
    } else if (slug === "kesar-chai") {
      setCategory("chai");
    } else {
      // Custom slug fallback
      updateRule({
        slug,
        name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      });
    }
  }, [params.slug, setCategory, updateRule]);

  return <CustomerPage />;
}
