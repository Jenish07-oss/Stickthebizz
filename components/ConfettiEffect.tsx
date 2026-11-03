"use client";

import React, { useEffect, useRef } from "react";

interface ConfettiEffectProps {
  active: boolean;
  onComplete?: () => void;
}

export default function ConfettiEffect({ active, onComplete }: ConfettiEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#F2765E", "#315B8C", "#16A34A", "#F59E0B", "#F5EBDD"];
    const particleCount = 55;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: canvas.width / 2 + (Math.random() - 0.5) * 140,
      y: canvas.height * 0.35 + (Math.random() - 0.5) * 60,
      vx: (Math.random() - 0.5) * 10,
      vy: -(Math.random() * 7 + 5),
      size: Math.random() * 7 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRotation: (Math.random() - 0.5) * 12,
      alpha: 0.9,
    }));

    let animationFrameId: number;
    let elapsed = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      elapsed += 1;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28; // Gravity
        p.vx *= 0.98; // Air resistance
        p.rotation += p.vRotation;
        p.alpha -= 0.015;

        if (p.alpha > 0) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (elapsed < 100 && particles.some((p) => p.alpha > 0)) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (onComplete) onComplete();
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none select-none fixed inset-0 z-30 h-full w-full"
    />
  );
}
