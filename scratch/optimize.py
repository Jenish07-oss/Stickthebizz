import re

# 1. Update app/owner/dashboard/page.tsx
with open("app/owner/dashboard/page.tsx", "r", encoding="utf-8") as f:
    owner = f.read()

# Replace unused icons
old_owner_icons = """import {
  Store,
  Users,
  Gift,
  Star,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Sliders,
  Award,
  Search,
  KeyRound,
  BellRing,
  Printer,
  History,
  ShieldCheck,
  RefreshCw,
  LogOut,
  ArrowRight,
} from "lucide-react";"""

new_owner_icons = """import {
  Store,
  Gift,
  QrCode,
  CheckCircle2,
  XCircle,
  Sliders,
  KeyRound,
  BellRing,
  Printer,
  ShieldCheck,
  RefreshCw,
  LogOut,
  ArrowRight,
} from "lucide-react";"""

owner = owner.replace(old_owner_icons, new_owner_icons)

# Replace init in owner dashboard
old_init_block = re.search(r"  // 1\. Initial Load of Merchant and Historical Ledger.*?useEffect\(\(\) => \{.*?\}, \[\]\);", owner, re.DOTALL)
if old_init_block:
    new_init_code = """  // 1. Initial Load of Merchant and Historical Ledger (Direct client-first + server fallback with timeout safeguard)
  useEffect(() => {
    let mounted = true;
    const timeoutTimer = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 4000);

    async function init() {
      try {
        // Direct browser session check
        const { data: { user: clientUser } } = await supabase.auth.getUser();

        let activeUser = clientUser;
        let m: any = null;

        if (activeUser) {
          // Direct client query to merchants table (fetch latest shop to prevent multi-row errors)
          const { data: merchantData } = await supabase
            .from("merchants")
            .select("*")
            .eq("owner_id", activeUser.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (merchantData && merchantData.length > 0) {
            m = merchantData[0];
          }
        }

        // Server action fallback
        if (!m) {
          const res = await getOwnerMerchant();
          if (res?.user) activeUser = res.user;
          if (res?.merchant) m = res.merchant;
        }

        if (!activeUser) {
          if (mounted) router.replace("/auth/owner/login");
          return;
        }

        if (m && mounted) {
          setMerchant(m);
          setShopNameInput(m.name);
          setMinSpendInput(Number(m.min_spend) || 100);
          setVisitsInput(Number(m.visits_required) || 10);
          setRewardInput(m.reward_name);
          setValidityInput(Number(m.validity_days) || 45);

          // Fetch pending visits
          const { visits: pending } = await getPendingVisits(m.id);
          if (mounted) {
            const initialQueue: LivePendingScan[] = (pending || []).map((v: any) => ({
              id: v.id,
              customerName: v.customers?.full_name || "Diner / Shopper",
              customerMasked: v.customers?.phone || "Customer Check-in",
              amount: Number(v.bill_amount) || m.min_spend,
              formattedTime: "Just now",
              status: v.status,
            }));
            setPendingQueue(initialQueue);
          }

          // Fetch ledger
          const { visits: leg } = await getMerchantLedger(m.id);
          if (mounted) {
            const initialLedger: LedgerRecord[] = (leg || []).map((v: any) => {
              const raw = v.customers?.phone || "";
              const msk =
                raw.length >= 10
                  ? `+91 ${raw.slice(0, 2)}*** **${raw.slice(-2)}`
                  : "Walk-in";
              return {
                id: v.id,
                customerName: v.customers?.full_name || "Customer",
                contactMasked: msk,
                visitDate: v.visit_date_ist,
                billAmount: Number(v.bill_amount) || m.min_spend,
                status: v.status,
                createdAt: v.created_at,
              };
            });
            setLedger(initialLedger);
          }
        }
      } catch (err) {
        console.error("Dashboard init error:", err);
      } finally {
        clearTimeout(timeoutTimer);
        if (mounted) {
          setLoading(false);
        }
      }
    }
    init();

    return () => {
      mounted = false;
      clearTimeout(timeoutTimer);
    };
  }, []);"""
    owner = owner.replace(old_init_block.group(0), new_init_code)

with open("app/owner/dashboard/page.tsx", "w", encoding="utf-8") as f:
    f.write(owner)
print("Updated app/owner/dashboard/page.tsx")

# 2. Update app/customer/dashboard/page.tsx
with open("app/customer/dashboard/page.tsx", "r", encoding="utf-8") as f:
    customer = f.read()

# Add syncCustomerAccountAction import if not present
old_cust_action_import = """import {
  getCustomerWalletAction,
  exportCustomerDataAction,
  deleteCustomerAccountAction,
  CustomerWalletData,
  CustomerStorePass,
} from "@/app/actions/customer";"""

new_cust_action_import = """import {
  getCustomerWalletAction,
  exportCustomerDataAction,
  deleteCustomerAccountAction,
  syncCustomerAccountAction,
  CustomerWalletData,
  CustomerStorePass,
} from "@/app/actions/customer";"""

customer = customer.replace(old_cust_action_import, new_cust_action_import)

# Replace unused icons
old_cust_icons = """import {
  Sparkles,
  Store,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  History,
  QrCode,
  LogOut,
  Calendar,
  Lock,
  Download,
  Trash2,
  AlertTriangle,
} from "lucide-react";"""

new_cust_icons = """import {
  Sparkles,
  Store,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  History,
  QrCode,
  LogOut,
  Download,
  Trash2,
  AlertTriangle,
} from "lucide-react";"""

customer = customer.replace(old_cust_icons, new_cust_icons)

# Update loadWallet
old_load_wallet = re.search(r"  useEffect\(\(\) => \{.*?async function loadWallet\(\) \{.*?loadWallet\(\);.*?\}, \[router, supabase\]\);", customer, re.DOTALL)
if old_load_wallet:
    new_load_wallet = """  useEffect(() => {
    async function loadWallet() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/auth/customer/login");
          return;
        }

        // If local storage has a phone number but user account doesn't have it synced yet
        const storedPhone = typeof window !== "undefined" ? localStorage.getItem("stb_customer_phone") : null;
        if (storedPhone && /^\\d{10}$/.test(storedPhone)) {
          await syncCustomerAccountAction({ phone: storedPhone });
        }

        const data = await getCustomerWalletAction();
        setWalletData(data);

        // Keep localStorage healed from verified server session
        if (data?.customer?.phone && typeof window !== "undefined") {
          localStorage.setItem("stb_customer_phone", data.customer.phone);
          if (data.customer.fullName) {
            localStorage.setItem("stb_customer_name", data.customer.fullName);
          }
        }
      } catch (err) {
        console.error("Failed to load customer wallet:", err);
      } finally {
        setLoading(false);
      }
    }
    loadWallet();
  }, [router, supabase]);"""
    customer = customer.replace(old_load_wallet.group(0), new_load_wallet)

with open("app/customer/dashboard/page.tsx", "w", encoding="utf-8") as f:
    f.write(customer)
print("Updated app/customer/dashboard/page.tsx")

# 3. Update components/CustomerView.tsx
with open("components/CustomerView.tsx", "r", encoding="utf-8") as f:
    view = f.read()

old_view_icons = """import {
  Sparkles,
  QrCode,
  ShieldCheck,
  Star,
  ArrowRight,
  Store,
  Calendar,
  Lock,
  Clock,
  CheckCircle2,
  Phone,
  User,
  LogOut,
  AlertCircle,
} from "lucide-react";"""

new_view_icons = """import {
  Sparkles,
  QrCode,
  ShieldCheck,
  Star,
  ArrowRight,
  Store,
  Calendar,
  Lock,
  Clock,
  CheckCircle2,
  Phone,
  AlertCircle,
} from "lucide-react";"""

view = view.replace(old_view_icons, new_view_icons)

with open("components/CustomerView.tsx", "w", encoding="utf-8") as f:
    f.write(view)
print("Updated components/CustomerView.tsx")

# 4. Update app/s/[slug]/page.tsx
with open("app/s/[slug]/page.tsx", "r", encoding="utf-8") as f:
    slug = f.read()

old_slug_user_block = re.search(r"  // 2\. Auto-Login: Detect customer from server session cookies.*?return \(", slug, re.DOTALL)
if old_slug_user_block:
    new_slug_user_block = """  // 2. Auto-Login: Detect customer from server session cookies
  const { data: { user } } = await supabase.auth.getUser();
  let initialCustomer: { id?: string; phone: string; fullName?: string | null; email?: string | null } | null = null;
  let initialStatus: { visitsCount: number; isLockedToday: boolean } | null = null;

  if (user) {
    const userPhone = (user.phone || user.user_metadata?.phone || "").replace(/\\D/g, "");
    const userEmail = (user.email || "").trim().toLowerCase();

    let customerRow = null;

    if (userPhone && userEmail) {
      const { data } = await supabase
        .from("customers")
        .select("id, phone, full_name, email")
        .or(`email.eq.${userEmail},phone.eq.${userPhone}`)
        .maybeSingle();
      customerRow = data;
    } else if (userPhone) {
      const { data } = await supabase
        .from("customers")
        .select("id, phone, full_name, email")
        .eq("phone", userPhone)
        .maybeSingle();
      customerRow = data;
    } else if (userEmail) {
      const { data } = await supabase
        .from("customers")
        .select("id, phone, full_name, email")
        .eq("email", userEmail)
        .maybeSingle();
      customerRow = data;
    }

    if (!customerRow && user?.id) {
      const { data } = await supabase
        .from("customers")
        .select("id, phone, full_name, email")
        .eq("auth_id", user.id)
        .maybeSingle();
      customerRow = data;
    }

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

  return ("""
    slug = slug.replace(old_slug_user_block.group(0), new_slug_user_block)

with open("app/s/[slug]/page.tsx", "w", encoding="utf-8") as f:
    f.write(slug)
print("Updated app/s/[slug]/page.tsx")

# 5. Update app/layout.tsx
with open("app/layout.tsx", "r", encoding="utf-8") as f:
    layout = f.read()

old_layout_html = """    <html lang="en" className={`${plusJakarta.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-screen bg-sand font-sans text-ink antialiased selection:bg-coral/20 selection:text-coral overflow-x-hidden">"""

new_layout_html = """    <html lang="en" className={`${plusJakarta.variable} ${ibmPlexMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://xzvpjprnexurgohfnimq.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://xzvpjprnexurgohfnimq.supabase.co" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-sand font-sans text-ink antialiased selection:bg-coral/20 selection:text-coral overflow-x-hidden">"""

layout = layout.replace(old_layout_html, new_layout_html)

with open("app/layout.tsx", "w", encoding="utf-8") as f:
    f.write(layout)
print("Updated app/layout.tsx")

