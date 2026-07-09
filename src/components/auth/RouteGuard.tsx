// src/components/auth/RouteGuard.tsx

"use client";

import { useAuth, hasModuleAccess } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";

interface RouteGuardProps {
    module: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function RouteGuard({ module, children, fallback }: RouteGuardProps) {
    const auth = useAuth();
    const router = useRouter();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const timer = setTimeout(() => setChecked(true), 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!checked) return;
        if (!auth.isLoggedIn) {
            router.replace("/");
        }
    }, [auth.isLoggedIn, checked, router]);

    // Still loading auth from localStorage
    if (!checked || !auth.isLoggedIn) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // No access to this module
    if (!hasModuleAccess(auth, module)) {
        if (fallback) return <>{fallback}</>;

        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center">
                <div className="p-5 rounded-full bg-destructive/10">
                    <ShieldAlert className="h-12 w-12 text-destructive" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">Access Denied</h2>
                    <p className="text-muted-foreground max-w-md">
                        You don&apos;t have permission to access this section.
                        Contact your administrator to request access.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
