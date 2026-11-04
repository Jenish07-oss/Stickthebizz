with open("components/CustomerView.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Make StampGrid dynamic
if 'import StampGrid from "@/components/StampGrid";' in c:
    c = c.replace(
        'import StampGrid from "@/components/StampGrid";',
        'const StampGrid = dynamic(() => import("@/components/StampGrid"), {\n  ssr: false,\n});'
    )
    print("Made StampGrid dynamic in CustomerView.tsx")

# Add client-side user fallback in loadCustomerState
old_phone_block = """        if (merchant.id) {
          const res = await getCustomerMerchantStatus(merchant.id, savedPhone);"""

new_phone_block = """        if (!savedPhone) {
          try {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              const userPhone = (user.phone || user.user_metadata?.phone || "").replace(/\\D/g, "");
              const userEmail = (user.email || "").trim().toLowerCase();
              let cRow = null;
              if (userPhone) {
                const { data } = await supabase.from("customers").select("id, phone, full_name").eq("phone", userPhone).maybeSingle();
                cRow = data;
              }
              if (!cRow && userEmail) {
                const { data } = await supabase.from("customers").select("id, phone, full_name").eq("email", userEmail).maybeSingle();
                cRow = data;
              }
              if (!cRow && user.id) {
                const { data } = await supabase.from("customers").select("id, phone, full_name").eq("auth_id", user.id).maybeSingle();
                cRow = data;
              }
              if (cRow?.phone) {
                savedPhone = cRow.phone;
                setCustomer({ id: cRow.id, phone: cRow.phone, fullName: cRow.full_name });
              }
            }
          } catch (e) {
            // silent client session check
          }
        }

        if (merchant.id) {
          const res = await getCustomerMerchantStatus(merchant.id, savedPhone);"""

if old_phone_block in c:
    c = c.replace(old_phone_block, new_phone_block)
    print("Added client session fallback in CustomerView.tsx")

with open("components/CustomerView.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("Updated CustomerView.tsx")

