import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * 1. CHAI CUP: Takeaway cup with lid, sleeve, and steam waves.
 */
export function ChaiCupIcon({ className = "w-6 h-6", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Steam lines */}
      <path
        d="M18 6C18 7.5 16.5 8.5 16.5 10M24 4C24 6 22 7.5 22 9.5M30 6C30 7.5 28.5 8.5 28.5 10"
        stroke="#413333"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Cup Lid */}
      <rect
        x="11"
        y="12"
        width="26"
        height="4"
        rx="2"
        fill="#315B8C"
        stroke="#413333"
        strokeWidth="2.5"
      />
      {/* Cup Body */}
      <path
        d="M13 16L16 41C16.2 42.5 17.5 43.5 19 43.5H29C30.5 43.5 31.8 42.5 32 41L35 16H13Z"
        fill="#F2765E"
        stroke="#413333"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Cup Sleeve */}
      <path
        d="M14.5 23L15.6 32.5C18.5 33.2 29.5 33.2 32.4 32.5L33.5 23C30.5 23.8 17.5 23.8 14.5 23Z"
        fill="#315B8C"
        stroke="#413333"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 2. BASKET: Wire shopping basket with handle and groceries.
 */
export function BasketIcon({ className = "w-6 h-6", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Grocery Items */}
      <rect x="26" y="17" width="10" height="7" rx="1.5" fill="#F2765E" stroke="#413333" strokeWidth="2" />
      <circle cx="17" cy="20" r="4.5" fill="#F2765E" stroke="#413333" strokeWidth="2" />
      <path d="M16 16L19 14" stroke="#413333" strokeWidth="2" strokeLinecap="round" />
      {/* Basket Handles */}
      <path
        d="M14 24L22 10C22.6 9 23.9 8.5 25 9.2L34 16"
        stroke="#F2765E"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 24L22 10C22.6 9 23.9 8.5 25 9.2L34 16"
        stroke="#413333"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Basket Top Rim */}
      <rect
        x="6"
        y="23"
        width="36"
        height="5"
        rx="2"
        fill="#315B8C"
        stroke="#413333"
        strokeWidth="2.5"
      />
      {/* Basket Wire Mesh Body */}
      <path
        d="M9 28L13 42C13.3 43 14.2 43.7 15.2 43.7H32.8C33.8 43.7 34.7 43 35 42L39 28H9Z"
        fill="#315B8C"
        stroke="#413333"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Grid lines */}
      <path d="M17 28V43M24 28V43M31 28V43M11 34H37M12.5 39H35.5" stroke="#F5EBDD" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * 3. STAR STAMP: Circular punch card stamp with star in center.
 */
export function StarStampIcon({ className = "w-6 h-6", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer serrated circular badge */}
      <circle cx="24" cy="24" r="19" fill="#315B8C" stroke="#413333" strokeWidth="2.5" />
      {/* Inner dotted border ring */}
      <circle cx="24" cy="24" r="15" stroke="#F5EBDD" strokeWidth="1.5" strokeDasharray="2.5 2.5" />
      {/* Inner circular background */}
      <circle cx="24" cy="24" r="12" fill="#F5EBDD" />
      {/* Star */}
      <path
        d="M24 14L26.8 20.2L33.5 20.8L28.4 25.3L29.9 31.9L24 28.4L18.1 31.9L19.6 25.3L14.5 20.8L21.2 20.2L24 14Z"
        fill="#F2765E"
        stroke="#413333"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 4. QR CODE: Corner brackets scan frame with QR matrix blocks.
 */
export function QrCodeIcon({ className = "w-6 h-6", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Corner Brackets */}
      <path
        d="M13 7H7V13M35 7H41V13M7 35V41H13M41 35V41H35"
        stroke="#F2765E"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Horizontal Laser Scan Line */}
      <line x1="7" y1="24" x2="41" y2="24" stroke="#F2765E" strokeWidth="2" strokeDasharray="3 2" />
      {/* QR Matrix blocks (top-left, top-right, bottom-left) */}
      <rect x="12" y="12" width="9" height="9" rx="1.5" fill="#315B8C" stroke="#413333" strokeWidth="1.5" />
      <rect x="14.5" y="14.5" width="4" height="4" fill="#F5EBDD" />
      <rect x="27" y="12" width="9" height="9" rx="1.5" fill="#315B8C" stroke="#413333" strokeWidth="1.5" />
      <rect x="29.5" y="14.5" width="4" height="4" fill="#F5EBDD" />
      <rect x="12" y="27" width="9" height="9" rx="1.5" fill="#315B8C" stroke="#413333" strokeWidth="1.5" />
      <rect x="14.5" y="29.5" width="4" height="4" fill="#F5EBDD" />
      {/* Detail pixels */}
      <rect x="27" y="27" width="4" height="4" fill="#413333" />
      <rect x="33" y="32" width="4" height="4" fill="#413333" />
      <rect x="27" y="34" width="3" height="3" fill="#413333" />
    </svg>
  );
}

/**
 * 5. MOBILE PHONE: Smartphone with checklist and stamp.
 */
export function MobilePhoneIcon({ className = "w-6 h-6", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Phone Case */}
      <rect
        x="12"
        y="6"
        width="24"
        height="36"
        rx="5"
        fill="#315B8C"
        stroke="#413333"
        strokeWidth="2.5"
      />
      {/* Screen */}
      <rect x="16" y="11" width="16" height="24" rx="2" fill="#FFFFFF" />
      {/* Speaker Bar & Home indicator */}
      <line x1="22" y1="8.5" x2="26" y2="8.5" stroke="#413333" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="24" cy="38.5" r="1.5" fill="#F5EBDD" />
      {/* Checklist Lines inside phone */}
      <path d="M19 16L21 18L24 14" stroke="#F2765E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="26" y1="16" x2="30" y2="16" stroke="#413333" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="19" y="21" width="3" height="3" fill="#F5EBDD" stroke="#413333" strokeWidth="1" />
      <line x1="24" y1="22.5" x2="30" y2="22.5" stroke="#413333" strokeWidth="1.5" strokeLinecap="round" />
      {/* Stamp Tool / Approved mark */}
      <path
        d="M20 31H28C28 29.5 26.5 29 25 29V26C25 25.5 24.5 25 24 25C23.5 25 23 25.5 23 26V29C21.5 29 20 29.5 20 31Z"
        fill="#F2765E"
        stroke="#413333"
        strokeWidth="1.2"
      />
    </svg>
  );
}

/**
 * 6. GIFT BOX: Present with ribbon bow and sparkle stars.
 */
export function GiftBoxIcon({ className = "w-6 h-6", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Sparkles around box */}
      <path d="M9 14L10 17L13 18L10 19L9 22L8 19L5 18L8 17L9 14Z" fill="#F2765E" />
      <path d="M40 12L41 14.5L43.5 15.5L41 16.5L40 19L39 16.5L36.5 15.5L39 14.5L40 12Z" fill="#F2765E" />
      <circle cx="41" cy="32" r="1.5" fill="#413333" />
      <circle cx="8" cy="31" r="1.5" fill="#413333" />
      {/* Box Body */}
      <rect
        x="12"
        y="21"
        width="24"
        height="18"
        rx="2"
        fill="#F2765E"
        stroke="#413333"
        strokeWidth="2.5"
      />
      {/* Box Lid */}
      <rect
        x="10"
        y="17"
        width="28"
        height="5.5"
        rx="1.5"
        fill="#F2765E"
        stroke="#413333"
        strokeWidth="2.5"
      />
      {/* Vertical Ribbon */}
      <rect x="21.5" y="17" width="5" height="22" fill="#315B8C" stroke="#413333" strokeWidth="2" />
      {/* Bow */}
      <path
        d="M24 17C21 12 14 11 15 15C16 18 22 17 24 17ZM24 17C27 12 34 11 33 15C32 18 26 17 24 17Z"
        fill="#315B8C"
        stroke="#413333"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="17" r="2.5" fill="#315B8C" stroke="#413333" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * 7. STREAK: Fire flame with horizontal motion lines.
 */
export function StreakIcon({ className = "w-6 h-6", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Motion Speed Lines */}
      <path d="M4 18H10M2 24H12M5 30H9" stroke="#413333" strokeWidth="2.5" strokeLinecap="round" />
      {/* Outer Flame Body */}
      <path
        d="M28 6C28 12 21 15 21 21C21 19 22 16.5 20 16.5C18 16.5 15 22 15 28C15 36.28 21.72 43 30 43C38.28 43 44 36.28 44 28C44 19 33 13 33 8C33 6.5 30 6 28 6Z"
        fill="#F2765E"
        stroke="#413333"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Inner Core Flame */}
      <path
        d="M29 25C29 27.5 27 29 27 32C27 34.5 29 36.5 31.5 36.5C34 36.5 36 34.5 36 32C36 29 32 27 32 25C31.5 24 29 24.5 29 25Z"
        fill="#315B8C"
        stroke="#413333"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 8. ANALYTICS: Bar chart with upward trending line graph.
 */
export function AnalyticsIcon({ className = "w-6 h-6", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Axes */}
      <path d="M8 8V41H42" stroke="#413333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Bar 1 */}
      <rect x="12" y="27" width="5.5" height="14" rx="1" fill="#315B8C" stroke="#413333" strokeWidth="2" />
      {/* Bar 2 */}
      <rect x="20" y="20" width="5.5" height="21" rx="1" fill="#315B8C" stroke="#413333" strokeWidth="2" />
      {/* Bar 3 */}
      <rect x="28" y="24" width="5.5" height="17" rx="1" fill="#315B8C" stroke="#413333" strokeWidth="2" />
      {/* Bar 4 */}
      <rect x="36" y="13" width="5.5" height="28" rx="1" fill="#F2765E" stroke="#413333" strokeWidth="2" />
      {/* Trend Line with Arrow */}
      <path
        d="M14 22L22 16L30 19L39 9"
        stroke="#413333"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M34 9H39V14" stroke="#413333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Trend Points */}
      <circle cx="14" cy="22" r="2.5" fill="#F2765E" stroke="#413333" strokeWidth="1.5" />
      <circle cx="22" cy="16" r="2.5" fill="#F2765E" stroke="#413333" strokeWidth="1.5" />
      <circle cx="30" cy="19" r="2.5" fill="#F2765E" stroke="#413333" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * 9. LOCATION: Folded map with star pin marker.
 */
export function LocationIcon({ className = "w-6 h-6", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Folded Map Panels */}
      <path
        d="M6 15L16 11L28 16L38 11V37L28 42L16 37L6 41V15Z"
        fill="#315B8C"
        stroke="#413333"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M16 11V37M28 16V42" stroke="#413333" strokeWidth="2" strokeDasharray="2 2" />
      {/* Map Pin */}
      <path
        d="M27 8C21.5 8 17 12.5 17 18C17 24 27 34 27 34C27 34 37 24 37 18C37 12.5 32.5 8 27 8Z"
        fill="#F2765E"
        stroke="#413333"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Star inside Pin */}
      <circle cx="27" cy="17" r="5" fill="#F5EBDD" />
      <path
        d="M27 13.5L28.2 16.2L31 16.4L28.8 18.3L29.5 21L27 19.5L24.5 21L25.2 18.3L23 16.4L25.8 16.2L27 13.5Z"
        fill="#413333"
      />
    </svg>
  );
}

/**
 * 10. ANTI-FRAUD: Padlock with clock dial inside (12h midnight lock).
 */
export function AntiFraudIcon({ className = "w-6 h-6", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Padlock Shackle */}
      <path
        d="M16 22V13C16 8.6 19.6 5 24 5C28.4 5 32 8.6 32 13V22"
        stroke="#315B8C"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M16 22V13C16 8.6 19.6 5 24 5C28.4 5 32 8.6 32 13V22"
        stroke="#413333"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Padlock Body */}
      <rect
        x="10"
        y="21"
        width="28"
        height="22"
        rx="4"
        fill="#F2765E"
        stroke="#413333"
        strokeWidth="2.5"
      />
      {/* Clock Face Inside Lock */}
      <circle cx="24" cy="32" r="7.5" fill="#F5EBDD" stroke="#413333" strokeWidth="2" />
      {/* Clock Hands indicating 12:00 */}
      <line x1="24" y1="32" x2="24" y2="27.5" stroke="#413333" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="32" x2="27" y2="32" stroke="#413333" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="24" cy="32" r="1.5" fill="#413333" />
      {/* Clock hour marks */}
      <circle cx="24" cy="26" r="0.75" fill="#413333" />
      <circle cx="24" cy="38" r="0.75" fill="#413333" />
      <circle cx="18" cy="32" r="0.75" fill="#413333" />
      <circle cx="30" cy="32" r="0.75" fill="#413333" />
    </svg>
  );
}

/**
 * 11. CUSTOMERS: Group of customer silhouettes / regulars.
 */
export function CustomersIcon({ className = "w-6 h-6", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left Customer (Woman/person) */}
      <circle cx="15" cy="18" r="4.5" fill="#315B8C" stroke="#413333" strokeWidth="2" />
      <path
        d="M8 36C8 30.5 11 26 15 26C17 26 18.5 27 19.5 28.5L14 36H8Z"
        fill="#315B8C"
        stroke="#413333"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Right Customer */}
      <circle cx="33" cy="18" r="4.5" fill="#315B8C" stroke="#413333" strokeWidth="2" />
      <path
        d="M40 36C40 30.5 37 26 33 26C31 26 29.5 27 28.5 28.5L34 36H40Z"
        fill="#315B8C"
        stroke="#413333"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Center Regular (Prominent in Coral) */}
      <circle cx="24" cy="15" r="6" fill="#F2765E" stroke="#413333" strokeWidth="2.5" />
      <path
        d="M13 38C13 31.4 18 25 24 25C30 25 35 31.4 35 38H13Z"
        fill="#F2765E"
        stroke="#413333"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 12. SUPPORT: Chat bubble with headset microphone.
 */
export function SupportIcon({ className = "w-6 h-6", size = 24 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Secondary Back Bubble */}
      <path
        d="M38 31L42 37L34 35.5C31.5 36.8 28.5 37 25 36C28 32 30 27 30 22C30 19 29 16.5 27.5 14.5C34 15 39 19.5 39 25C39 27.2 38.6 29.2 38 31Z"
        fill="#315B8C"
        stroke="#413333"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Primary Front Bubble in Coral */}
      <path
        d="M10 37L6 42L14 40.5C17 42 20.5 42.5 24 42C33.4 42 41 35.3 41 27C41 18.7 33.4 12 24 12C14.6 12 7 18.7 7 27C7 30.8 8.8 34.3 12 36.8L10 37Z"
        fill="#F2765E"
        stroke="#413333"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Headset Arc */}
      <path
        d="M16 27C16 22.5 19.6 19 24 19C28.4 19 32 22.5 32 27"
        stroke="#413333"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Headset Earcups */}
      <rect x="14" y="25" width="3.5" height="6" rx="1.5" fill="#315B8C" stroke="#413333" strokeWidth="1.5" />
      <rect x="30.5" y="25" width="3.5" height="6" rx="1.5" fill="#315B8C" stroke="#413333" strokeWidth="1.5" />
      {/* Headset Mic */}
      <path
        d="M32 29C32 32.5 29 34 26 34"
        stroke="#413333"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="25" cy="34" r="1.5" fill="#315B8C" stroke="#413333" strokeWidth="1" />
    </svg>
  );
}

