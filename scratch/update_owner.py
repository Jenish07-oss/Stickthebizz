with open("app/owner/dashboard/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Add LiveActivityToast import
if "LiveActivityToast" not in c:
    c = c.replace(
        'const ConfettiEffect = dynamic(() => import("@/components/ConfettiEffect"), {\n  ssr: false,\n});',
        'const ConfettiEffect = dynamic(() => import("@/components/ConfettiEffect"), {\n  ssr: false,\n});\nconst LiveActivityToast = dynamic(() => import("@/components/LiveActivityToast"), {\n  ssr: false,\n});'
    )

# Add needsSetup check
old_check = """        // Server action fallback
        if (!m) {
          const res = await getOwnerMerchant();
          if (res?.user) activeUser = res.user;
          if (res?.merchant) m = res.merchant;
        }

        if (!activeUser) {
          if (mounted) router.replace("/auth/owner/login");
          return;
        }"""

new_check = """        // Server action fallback
        if (!m) {
          const res = await getOwnerMerchant();
          if (res?.user) activeUser = res.user;
          if (res?.merchant) m = res.merchant;
          if (res?.needsSetup) {
            if (mounted) {
              setMerchant(null);
              setLoading(false);
            }
            return;
          }
        }

        if (!activeUser) {
          if (mounted) router.replace("/auth/owner/login");
          return;
        }

        if (!m) {
          if (mounted) {
            setMerchant(null);
            setLoading(false);
          }
          return;
        }"""

if old_check in c:
    c = c.replace(old_check, new_check)
    print("Added needsSetup check in owner dashboard")
else:
    print("Could not find old_check verbatim")

# Add <LiveActivityToast /> render
if "<LiveActivityToast />" not in c:
    c = c.replace(
        '<Navbar />\n      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">',
        '<Navbar />\n      <LiveActivityToast />\n      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">'
    )
    print("Added LiveActivityToast render")

with open("app/owner/dashboard/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("Updated app/owner/dashboard/page.tsx")

