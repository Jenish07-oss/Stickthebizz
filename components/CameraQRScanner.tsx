"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Camera, X, QrCode, AlertCircle, ArrowRight, Upload, Sparkles } from "lucide-react";
import jsQR from "jsqr";

interface CameraQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CameraQRScanner({ isOpen, onClose }: CameraQRScannerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [hasCamera, setHasCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleDetectedUrl = useCallback(
    (urlOrSlug: string) => {
      stopCamera();
      onClose();

      let target = urlOrSlug.trim();
      // Handle full URL or path
      if (target.includes("/s/")) {
        const afterS = target.split("/s/")[1];
        window.location.href = `/s/${afterS}`;
        return;
      }

      // If user pasted or scanned a raw slug
      const cleanSlug = target.replace(/[^a-zA-Z0-9_-]/g, "");
      if (cleanSlug) {
        window.location.href = `/s/${cleanSlug}`;
      }
    },
    [stopCamera, onClose]
  );

  const startScanningLoop = useCallback(() => {
    // Check if BarcodeDetector API exists natively
    const hasBarcodeDetector = typeof window !== "undefined" && "BarcodeDetector" in window;
    let barcodeDetector: any = null;
    if (hasBarcodeDetector) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      } catch {
        barcodeDetector = null;
      }
    }

    const canvas = canvasRef.current || document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const scanFrame = async () => {
      const video = videoRef.current;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      }

      // 1. Hardware-accelerated BarcodeDetector if available
      if (barcodeDetector) {
        try {
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            handleDetectedUrl(barcodes[0].rawValue);
            return;
          }
        } catch {
          // fallback to jsQR below
        }
      }

      // 2. High-precision universal jsQR canvas scan
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          handleDetectedUrl(code.data);
          return;
        }
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [handleDetectedUrl]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setHasCamera(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setCameraError(
        "Camera access is not supported on this browser. You can upload a QR screenshot or enter the store code below."
      );
      return;
    }

    let stream: MediaStream | null = null;

    // Try ideal back camera (environment) first
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch {
      // Fallback: try standard video without strict constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err: any) {
        setHasCamera(false);
        const isDenied = err.name === "NotAllowedError" || err.name === "PermissionDeniedError";
        setCameraError(
          isDenied
            ? "Camera permission was denied. Tap the lock icon near your browser address bar to allow Camera, or upload a photo/screenshot of the counter QR code below."
            : "Camera is busy or unavailable. You can upload a photo of the counter QR stand below."
        );
        return;
      }
    }

    if (!stream) return;
    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.setAttribute("playsinline", "true");
      try {
        await videoRef.current.play();
        startScanningLoop();
      } catch (playErr) {
        console.warn("Video playback error:", playErr);
      }
    }
  }, [startScanningLoop]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Handle Image File Upload (QR screenshot / photo)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    setIsProcessingFile(true);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          setIsProcessingFile(false);
          setFileError("Unable to initialize image processor.");
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        setIsProcessingFile(false);
        if (code && code.data) {
          handleDetectedUrl(code.data);
        } else {
          setFileError("No QR code detected in this photo. Please make sure the code is clearly visible.");
        }
      };
      img.onerror = () => {
        setIsProcessingFile(false);
        setFileError("Failed to read image file.");
      };
      img.src = reader.result as string;
    };
    reader.onerror = () => {
      setIsProcessingFile(false);
      setFileError("Failed to upload image.");
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDetectedUrl(manualCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
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
              <p className="text-[11px] text-ink/65">Point your camera at the shop counter standee</p>
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
        <div className="my-4 relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-black aspect-square max-h-[260px] w-full">
          {hasCamera ? (
            <>
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                muted
                autoPlay
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Viewfinder Overlay with Neon Corners */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                <div className="relative h-40 w-40 rounded-2xl border-2 border-dashed border-primary/60">
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
              <AlertCircle className="h-8 w-8 text-primary mb-2" />
              <p className="text-xs text-white/90 leading-relaxed max-w-xs">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Action: Upload Photo of QR Code */}
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingFile}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-sand/60 px-4 py-2.5 text-xs font-bold text-secondary transition hover:bg-sand hover:border-primary disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5 text-primary" />
            <span>{isProcessingFile ? "Scanning image..." : "Upload QR Photo / Screenshot"}</span>
          </button>
          {fileError && (
            <p className="mt-1.5 text-center text-[11px] font-semibold text-rose-600">
              {fileError}
            </p>
          )}
        </div>

        {/* Manual Code Input Option */}
        <div className="pt-2 border-t border-border">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink/60 mb-1.5">
            Or Enter Store Code / URL:
          </p>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. chaii-wala-t70k or stickthebizz.in/s/..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 rounded-xl border border-border px-3.5 py-2 text-xs font-mono font-bold text-secondary focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary transition shrink-0"
            >
              <span>Go</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
