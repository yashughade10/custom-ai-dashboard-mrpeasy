'use client'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { removeLocalStorageItem } from "@/lib/local-storage"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    LogOut,
    ListOrdered,
    Sparkles,
    FileText,
    TrendingUp,
    Package,
    Star,
    Brain,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import React from "react"

const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    {
        name: "AI Analytics",
        href: "/dashboard/ai-analytics",
        icon: Sparkles,
        children: [
            { name: "Executive Summary", hash: "executive-summary", icon: FileText },
            { name: "Forecasting Engine", hash: "forecasting-engine", icon: TrendingUp },
            { name: "Inventory Stockout Prediction", hash: "inventory-stockout-prediction", icon: Package },
            { name: "Top Products", hash: "top-products", icon: Star },
            { name: "Inventory Forecasting", hash: "inventory-forecasting", icon: TrendingUp },
            { name: "AI Recommendations", hash: "ai-recommendations", icon: Brain },
        ],
    },
    { name: "Orders", href: "/dashboard/orders", icon: ListOrdered },
    // { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
    // { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function AppSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [activeHash, setActiveHash] = React.useState("");

    React.useEffect(() => {
        const handleHashChange = () => {
            setActiveHash(window.location.hash.replace(/^#/, ""));
        };

        handleHashChange();
        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, []);

    React.useEffect(() => {
        setActiveHash(window.location.hash.replace(/^#/, ""));
    }, [pathname]);

    const handleLogout = () => {
        removeLocalStorageItem("auth");
        router.replace("/");
    };

    return (
        <Sidebar className="border-r-0">
            <SidebarHeader className="px-5 py-[14px]">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <img src="https://www.vacliftaustralia.com/logo/navlogo.png" alt="logo" className="h-10 sm:h-12 lg:h-[3.6vw]" />
                </Link>
            </SidebarHeader>
            <SidebarContent className="px-2 py-2">
                <SidebarGroup className="py-1">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => {
                                const isOverview = item.href === '/dashboard';
                                const isActive = isOverview ?
                                    pathname === '/dashboard' :
                                    pathname === item.href || pathname.startsWith(item.href + '/')
                                return (
                                    <SidebarMenuItem key={item.name}>
                                        <SidebarMenuButton
                                            asChild
                                            className={cn(
                                                "text-sm px-3 h-10 rounded-lg transition-all duration-150 gap-3",
                                                isActive
                                                    ? "bg-[#014FA2] text-primary-foreground font-medium shadow-sm"
                                                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                                            )}
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="h-[18px] w-[18px] shrink-0" />
                                                <span>{item.name}</span>
                                            </Link>
                                        </SidebarMenuButton>

                                        {"children" in item && item.children?.length && isActive ? (
                                            <SidebarMenuSub className="mt-1">
                                                {item.children.map((child, index) => {
                                                    const defaultHash = item.children?.[0]?.hash ?? "";
                                                    const resolvedActiveHash = activeHash || defaultHash;
                                                    const isChildActive = isActive && resolvedActiveHash === child.hash;
                                                    return (
                                                        <SidebarMenuSubItem key={child.hash}>
                                                            <SidebarMenuSubButton
                                                                asChild
                                                                isActive={isChildActive}
                                                                className={cn(
                                                                    "text-xs",
                                                                    isChildActive ? "bg-[#014FA2]/15 text-[#014FA2] font-medium" : ""
                                                                )}
                                                            >
                                                                <Link
                                                                    href={`${item.href}#${child.hash}`}
                                                                    onClick={() => setActiveHash(child.hash)}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    {child.icon && (
                                                                        <child.icon
                                                                            className={cn(
                                                                                "h-4 w-4 shrink-0",
                                                                                isChildActive ? "text-[#014FA2]" : "text-muted-foreground"
                                                                            )}
                                                                        />
                                                                    )}
                                                                    <span>{child.name}</span>
                                                                </Link>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    );
                                                })}
                                            </SidebarMenuSub>
                                        ) : null}
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarSeparator />
            <SidebarFooter className="px-5 py-4">
                <SidebarMenu className="mt-4 rounded-xl border border-[#014FA2] bg-[#014FA2]/10 p-2 shadow-[0_12px_30px_-20px_rgba(0,0,0,0.65)]">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleLogout}
                            className={cn(
                                "text-sm px-3 h-10 rounded-lg transition-all duration-150 gap-3 bg-[#014FA2]/60",
                                "text-white hover:text-white hover:bg-[#014FA2]/80"
                            )}
                        >
                            <LogOut className="h-[18px] w-[18px] shrink-0" />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
