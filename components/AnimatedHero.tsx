"use client";

import React from "react";

interface AnimatedHeroProps {
  children: React.ReactNode;
  className?: string;
}

export default function AnimatedHero({ children, className = "" }: AnimatedHeroProps) {
  return (
    <section className={`relative bg-sand ${className}`}>
      {children}
    </section>
  );
}
