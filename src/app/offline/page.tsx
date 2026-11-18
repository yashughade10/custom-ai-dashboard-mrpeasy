"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
          <img
            src="/bwe-logo.png"
            alt="Vaclift BWE Logo"
            className="h-10 w-auto object-contain"
          />

          <div className="flex size-14 items-center justify-center rounded-full bg-[#014FA2]/10 text-[#014FA2]">
            <WifiOff className="size-7" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">
              You&apos;re currently offline
            </h1>
            <p className="text-sm text-muted-foreground">
              Vaclift AI Dashboard needs an active internet connection to load
              live MRP, inventory, and CRM data.
            </p>
          </div>

          <Button
            onClick={() => window.location.reload()}
            className="mt-2 gap-2 bg-[#014FA2] hover:bg-[#013d7d] text-white cursor-pointer"
          >
            <RefreshCw className="size-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

