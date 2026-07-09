// src/app/dashboard/layout.tsx

"use client";

import AppHeader from "@/components/common/app-header";
import { AppSidebar } from "@/components/common/app-sidebar";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const auth = useAuth();
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setReady(true), 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (ready && !auth.isLoggedIn) {
            router.replace("/");
        }
    }, [ready, auth.isLoggedIn, router]);

    if (!ready || !auth.isLoggedIn) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <AppHeader />
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
