"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, X, QrCode, AlertCircle, ArrowRight, Sparkles } from "lucide-react";

interface CameraQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CameraQRScanner({ isOpen, onClose }: CameraQRScannerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setCameraError("Camera access is not supported on this browser. You can enter the store code below.");
        setIsScanning(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }

      // Check for native BarcodeDetector API support
      if ("BarcodeDetector" in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });

        const scanFrame = async () => {
          if (!videoRef.current || !streamRef.current) return;
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue;
              handleDetectedUrl(rawValue);
              return;
            }
          } catch {
            // Frame detection error, continue next frame
          }
          if (streamRef.current) {
            requestAnimationFrame(scanFrame);
          }
        };

        requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.warn("Camera start note:", err.message);
      setHasCamera(false);
      setCameraError("Camera permission was denied or camera is unavailable. Enter the store code below.");
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleDetectedUrl = (urlOrSlug: string) => {
    stopCamera();
    onClose();

    // Check if it's a full URL like https://.../s/kesar-chai or just a slug like kesar-chai
    let targetSlug = urlOrSlug.trim();
    if (targetSlug.includes("/s/")) {
      targetSlug = targetSlug.split("/s/")[1].split("?")[0].split("#")[0];
    }

    if (targetSlug) {
      window.location.href = `/s/${targetSlug}`;
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDetectedUrl(manualCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75  p-4">
      <div className="relative w-full max-w-md rounded-[2.5rem] bg-white p-6 shadow-2xl overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <Camera className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-display text-base font-extrabold text-secondary">
                Scan Counter QR Stand
              </h3>
              <p className="text-[11px] text-ink/65">Point your camera at the acrylic counter stand</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-sand text-secondary hover:bg-border transition"
            aria-label="Close Scanner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Viewfinder Canvas */}
        <div className="my-5 relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-black aspect-square max-h-[280px] w-full">
          {hasCamera ? (
            <>
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                muted
                autoPlay
                playsInline
              />

              {/* Viewfinder Overlay with Neon Corners */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
                <div className="relative h-44 w-44 rounded-2xl border-2 border-dashed border-primary/60">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 h-4 w-4 border-t-4 border-l-4 border-primary rounded-tl" />
                  <div className="absolute -top-1 -right-1 h-4 w-4 border-t-4 border-r-4 border-primary rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 h-4 w-4 border-b-4 border-l-4 border-primary rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 border-b-4 border-r-4 border-primary rounded-br" />

                  {/* Red Laser Scanning Beam */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#F2765E] to-transparent shadow-[0_0_12px_#F2765E] animate-laser-sweep" />
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-white">
              <AlertCircle className="h-10 w-10 text-primary mb-2" />
              <p className="text-xs text-white/80 leading-relaxed">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Manual Code Input Option */}
        <div className="pt-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink/60 mb-2">
            Or Enter Store Code / Pass Slug:
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. kesar-chai or patel-kirana"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 rounded-xl border border-border px-3.5 py-2.5 text-xs font-mono font-bold text-secondary focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-primary/90 transition shrink-0"
            >
              <span>Go</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Quick preset links for instant testing */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-ink/60 font-semibold">Quick test:</span>
            <button
              type="button"
              onClick={() => handleDetectedUrl("kesar-chai")}
              className="rounded-lg bg-sand px-2 py-0.5 font-mono text-secondary hover:bg-border transition font-bold"
            >
              kesar-chai
            </button>
            <button
              type="button"
              onClick={() => handleDetectedUrl("patel-kirana")}
              className="rounded-lg bg-sand px-2 py-0.5 font-mono text-secondary hover:bg-border transition font-bold"
            >
              patel-kirana
            </button>
            <button
              type="button"
              onClick={() => handleDetectedUrl("the-bun-co")}
              className="rounded-lg bg-sand px-2 py-0.5 font-mono text-secondary hover:bg-border transition font-bold"
            >
              the-bun-co
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

