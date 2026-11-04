with open("app/customer/dashboard/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

old_dyn = """const CameraQRScanner = dynamic(() => import("@/components/CameraQRScanner"), {
  ssr: false,
});"""

new_dyn = """const CameraQRScanner = dynamic(() => import("@/components/CameraQRScanner"), {
  ssr: false,
});
const ConfettiEffect = dynamic(() => import("@/components/ConfettiEffect"), {
  ssr: false,
});
const StampGrid = dynamic(() => import("@/components/StampGrid"), {
  ssr: false,
});
const RewardTicket = dynamic(() => import("@/components/RewardTicket"), {
  ssr: false,
});
const PhoneFrame = dynamic(() => import("@/components/PhoneFrame"), {
  ssr: false,
});"""

if old_dyn in c:
    c = c.replace(old_dyn, new_dyn)
    print("Added dynamic component imports to customer dashboard")

with open("app/customer/dashboard/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("Updated customer dashboard")

