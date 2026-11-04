with open("app/auth/owner/register/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "export default function OwnerRegisterPage() {",
    "function OwnerRegisterForm() {"
)

suspense_wrapper = """
export default function OwnerRegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-sand">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <OwnerRegisterForm />
    </React.Suspense>
  );
}
"""

c = c + "\n" + suspense_wrapper

with open("app/auth/owner/register/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)

print("Wrapped OwnerRegisterPage in Suspense boundary.")

