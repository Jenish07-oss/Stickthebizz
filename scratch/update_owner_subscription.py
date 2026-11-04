with open("app/owner/dashboard/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# 1. Add imports
old_imports = """import { useRouter } from "next/navigation";"""
new_imports = """import { useRouter } from "next/navigation";
import {
  checkMerchantSubscriptionStatusAction,
  createSubscriptionOrderAction,
  verifyAndActivateSubscriptionAction,
  validatePromoCodeAction,
} from "@/app/actions/subscription";
import { SUBSCRIPTION_PLANS, calculatePlanPricing, SubscriptionPlanId } from "@/lib/razorpay";
import { AlertTriangle, Tag, CreditCard } from "lucide-react";"""

if old_imports in c:
    c = c.replace(old_imports, new_imports)

# 2. Add state variables inside component
old_state = """  const [newShopName, setNewShopName] = useState("");
  const [newShopCategory, setNewShopCategory] = useState("Cafe / Chai");"""

new_state = """  const [newShopName, setNewShopName] = useState("");
  const [newShopCategory, setNewShopCategory] = useState("Cafe / Chai");

  // Subscription & 1-Day Grace Period State
  const [subStatus, setSubStatus] = useState<"ACTIVE" | "GRACE_PERIOD" | "INACTIVE">("ACTIVE");
  const [subDetails, setSubDetails] = useState<any>(null);
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewPlan, setRenewPlan] = useState<SubscriptionPlanId>("YEARLY");
  const [renewPromo, setRenewPromo] = useState("");
  const [renewPromoApplied, setRenewPromoApplied] = useState<string | null>(null);
  const [renewPromoMsg, setRenewPromoMsg] = useState<string | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewError, setRenewError] = useState<string | null>(null);"""

if old_state in c:
    c = c.replace(old_state, new_state)

# 3. Add subscription check inside init()
old_init_status = """          // Fetch ledger
          const { visits: leg } = await getMerchantLedger(m.id);"""

new_init_status = """          // Check Subscription & 1-Day Grace Period
          const subCheck = await checkMerchantSubscriptionStatusAction(m.id);
          if (mounted) {
            setSubStatus(subCheck.status as any);
            setSubDetails(subCheck);
          }

          // Fetch ledger
          const { visits: leg } = await getMerchantLedger(m.id);"""

if old_init_status in c:
    c = c.replace(old_init_status, new_init_status)

# 4. Add renewal handler
renewal_logic = """
  // Load Razorpay Script for Renewal
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as any).Razorpay) return resolve(true);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleApplyRenewPromo = async () => {
    if (!renewPromo.trim()) return;
    try {
      const res = await validatePromoCodeAction({
        code: renewPromo.trim(),
        planId: renewPlan,
      });
      if (res.success && res.code) {
        setRenewPromoApplied(res.code);
        setRenewPromoMsg(`✓ ${res.description}`);
      } else {
        setRenewPromoApplied(null);
        setRenewPromoMsg(res.message || "Invalid code.");
      }
    } catch {
      setRenewPromoMsg("Error validating code.");
    }
  };

  const handleExecuteRenewal = async () => {
    if (!merchant?.id) return;
    setIsRenewing(true);
    setRenewError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const orderRes = await createSubscriptionOrderAction({
        planId: renewPlan,
        promoCode: renewPromoApplied || undefined,
        shopName: merchant.name,
        email: user?.email || "",
        mobile: user?.phone || user?.user_metadata?.phone || "9999999999",
      });

      if (!orderRes.success) {
        setRenewError(orderRes.message || "Failed to create renewal order.");
        setIsRenewing(false);
        return;
      }

      if (orderRes.isFree) {
        const actRes = await verifyAndActivateSubscriptionAction({
          orderId: orderRes.orderId,
          planId: renewPlan,
          promoCode: renewPromoApplied || undefined,
          shopName: merchant.name,
          ownerName: user?.user_metadata?.full_name || "Owner",
          category: merchant.category || "Cafe / Chai",
          mobile: user?.phone || "9999999999",
          email: user?.email || "",
          ownerId: user?.id,
        });

        if (actRes.success) {
          setSubStatus("ACTIVE");
          setRenewModalOpen(false);
          setShowConfetti(true);
        } else {
          setRenewError(actRes.message || "Renewal activation failed.");
        }
        setIsRenewing(false);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setRenewError("Failed to load Razorpay payment gateway.");
        setIsRenewing(false);
        return;
      }

      const options = {
        key: orderRes.keyId,
        amount: orderRes.amountPaise,
        currency: "INR",
        name: "StickTheBizz",
        description: `Renew ${SUBSCRIPTION_PLANS[renewPlan].name}`,
        image: "/icon.png",
        order_id: orderRes.orderId,
        prefill: {
          name: user?.user_metadata?.full_name || "Owner",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: { color: "#E05A47" },
        handler: async (resp: any) => {
          const actRes = await verifyAndActivateSubscriptionAction({
            orderId: resp.razorpay_order_id,
            paymentId: resp.razorpay_payment_id,
            signature: resp.razorpay_signature,
            planId: renewPlan,
            promoCode: renewPromoApplied || undefined,
            shopName: merchant.name,
            ownerName: user?.user_metadata?.full_name || "Owner",
            category: merchant.category || "Cafe / Chai",
            mobile: user?.phone || "9999999999",
            email: user?.email || "",
            ownerId: user?.id,
          });

          if (actRes.success) {
            setSubStatus("ACTIVE");
            setRenewModalOpen(false);
            setShowConfetti(true);
          } else {
            setRenewError(actRes.message || "Renewal failed.");
          }
          setIsRenewing(false);
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", () => {
        setRenewError("Payment cancelled or failed.");
        setIsRenewing(false);
      });
      rzp.open();
    } catch (err: any) {
      setRenewError(err.message || "Unexpected error during renewal.");
      setIsRenewing(false);
    }
  };
"""

# Insert renewal logic before handleSignOut
c = c.replace("  const handleSignOut = async () => {", renewal_logic + "\n  const handleSignOut = async () => {")

# 5. Add Lockdown View if INACTIVE right after if (!merchant)
lockdown_jsx = """
  // 3. Subscription Inactive Lockdown Screen (When 1-Day Grace Period Has Ended)
  if (subStatus === "INACTIVE") {
    const renewPricing = calculatePlanPricing(renewPlan, renewPromoApplied || undefined);

    return (
      <div className="flex min-h-screen flex-col bg-sand">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-xl rounded-[2.5rem] border-2 border-red-200 bg-white p-8 sm:p-10 shadow-float text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-red-600">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-3 py-1 font-mono text-xs font-bold text-red-700">
              SUBSCRIPTION INACTIVE • GRACE PERIOD EXPIRED
            </span>
            <h1 className="mt-3 font-display text-2xl sm:text-3xl font-extrabold text-secondary">
              Counter Terminal Deactivated
            </h1>
            <p className="mt-2 text-xs text-ink/75 leading-relaxed">
              Your subscription for <strong className="text-secondary">{merchant.name}</strong> has expired and the 24-hour grace window has ended. Your counter QR standee is paused and diners/shoppers cannot claim stamps until renewed.
            </p>

            {renewError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
                {renewError}
              </div>
            )}

            {/* Plan Selector */}
            <div className="mt-6 grid grid-cols-2 gap-3 text-left">
              <button
                type="button"
                onClick={() => setRenewPlan("MONTHLY")}
                className={`rounded-2xl p-4 border-2 transition ${
                  renewPlan === "MONTHLY" ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-white"
                }`}
              >
                <span className="block font-mono text-[10px] font-bold uppercase text-ink/60">Monthly Plan</span>
                <span className="font-display text-xl font-extrabold text-secondary">₹749</span>
                <span className="text-[11px] text-ink/60 block">30 days access</span>
              </button>

              <button
                type="button"
                onClick={() => setRenewPlan("YEARLY")}
                className={`rounded-2xl p-4 border-2 transition relative ${
                  renewPlan === "YEARLY" ? "border-primary bg-secondary text-white shadow-sm" : "border-border bg-white"
                }`}
              >
                <span className="absolute top-1 right-2 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white">
                  20% OFF
                </span>
                <span className={`block font-mono text-[10px] font-bold uppercase ${renewPlan === "YEARLY" ? "text-coral" : "text-primary"}`}>Annual Plan</span>
                <span className="font-display text-xl font-extrabold">₹7,190</span>
                <span className={`text-[11px] block ${renewPlan === "YEARLY" ? "text-white/70" : "text-ink/60"}`}>Save ₹1,798</span>
              </button>
            </div>

            {/* Redeem Code Input */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={renewPromo}
                onChange={(e) => setRenewPromo(e.target.value.toUpperCase())}
                placeholder="Partner Code (e.g. BETA100)"
                className="flex-1 rounded-xl border border-border bg-sand/30 px-3 py-2 text-xs font-mono font-bold uppercase outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleApplyRenewPromo}
                className="rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-white hover:bg-primary"
              >
                Apply
              </button>
            </div>

            {renewPromoMsg && (
              <p className="mt-1 text-[11px] font-semibold text-emerald-700 text-left">
                {renewPromoMsg}
              </p>
            )}

            {/* Renew Button */}
            <button
              type="button"
              disabled={isRenewing}
              onClick={handleExecuteRenewal}
              className="mt-6 flex min-h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-card transition hover:bg-primary/90 disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              <span>
                {isRenewing
                  ? "Processing..."
                  : renewPricing.isFreeActivation
                  ? "✓ Reactivate Counter Free (₹0 Code Applied)"
                  : `Pay ₹${renewPricing.finalAmount.toLocaleString("en-IN")} via Razorpay & Reactivate`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-4 text-xs font-bold text-ink/60 hover:text-secondary"
            >
              Log Out of Account
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
"""

c = c.replace('  if (!merchant) {\n    return (', lockdown_jsx + '\n  if (!merchant) {\n    return (')

# 6. Add Grace Period Banner in Main View right before the Top Title Banner
old_top_div = """      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Top Title Banner & Profile Card */}"""

new_top_div = """      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* GRACE PERIOD URGENT WARNING BANNER */}
          {subStatus === "GRACE_PERIOD" && (
            <div className="mb-6 rounded-3xl border-2 border-amber-300 bg-amber-50 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-200 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-extrabold text-amber-950 uppercase tracking-wider">
                    ⚠️ Subscription Expired — 1-Day Grace Period Active!
                  </h3>
                  <p className="mt-0.5 text-xs text-amber-800">
                    Your counter QR standee and terminal will be permanently deactivated in <strong>{subDetails?.hoursRemaining || 24} hours</strong> unless renewed.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRenewModalOpen(true)}
                className="shrink-0 inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-primary px-5 text-xs font-bold text-white shadow-sm hover:bg-primary/90"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Renew Counter Plan</span>
              </button>
            </div>
          )}

          {/* Top Title Banner & Profile Card */}"""

if old_top_div in c:
    c = c.replace(old_top_div, new_top_div)

# 7. Add Subscription Status Pill in Profile Card
old_stat_strip = """                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Terminal Online
                </span>"""

new_stat_strip = """                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 border border-emerald-200 shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Terminal Online
                </span>

                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold border ${
                  subStatus === "ACTIVE"
                    ? "bg-sand text-secondary border-border"
                    : "bg-amber-100 text-amber-800 border-amber-300"
                }`}>
                  <CreditCard className="h-3 w-3 text-primary" />
                  <span>
                    {subStatus === "GRACE_PERIOD"
                      ? "Grace Period (1 Day Left)"
                      : subDetails?.daysRemaining
                      ? `${subDetails.daysRemaining} Days Left`
                      : "Plan Active"}
                  </span>
                </span>"""

if old_stat_strip in c:
    c = c.replace(old_stat_strip, new_stat_strip)

with open("app/owner/dashboard/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)

print("Updated owner dashboard with subscription & grace period gating.")

