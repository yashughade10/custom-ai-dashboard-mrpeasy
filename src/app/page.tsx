
"use client";

import { SignIn } from "@/components/forms/SignIn";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    try {
      const rawAuth = localStorage.getItem("auth");
      if (!rawAuth) return;
      const auth = JSON.parse(rawAuth) as { isLoggedIn?: boolean } | null;
      if (auth?.isLoggedIn) {
        router.replace("/dashboard");
      }
    } catch {
      // ignore invalid JSON / storage errors
    }
  }, [router]);

  return (
    <main className="relative min-h-svh overflow-hidden bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -top-24 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-r from-primary/15 via-primary/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 h-[420px] w-[720px] translate-x-1/2 rounded-full bg-gradient-to-r from-transparent via-primary/10 to-primary/15 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-svh max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <section className="hidden lg:block">
            <div className="max-w-md">
              <img src="https://www.vacliftaustralia.com/logo/navlogo.png" alt="logo" className="h-10 sm:h-12 lg:h-[5vw]" />
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="mt-4 text-muted-foreground">
                Sign in to continue to your dashboard.
              </p>

              <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 text-primary" />
                  <span>Track production and inventory in one place.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 text-primary" />
                  <span>Quick access to analytics and reports.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 text-primary" />
                  <span>Secure sign-in for your team.</span>
                </li>
              </ul>
            </div>
          </section>

          <section className="mx-auto w-full max-w-md">
            <Card className="bg-card/90 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/70">
              <CardContent>
                <SignIn />
              </CardContent>
            </Card>
            {/* <p className="mt-4 text-center text-xs text-muted-foreground">
              By continuing, you agree to our terms and privacy policy.
            </p> */}
          </section>
        </div>
      </div>
    </main>
  );
}
