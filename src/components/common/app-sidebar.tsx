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
    Users2,
    Contact,
    Building2,
    Handshake,
    Lightbulb,
    UserPlus,
    CalendarClock,
    Mail,
    Factory,
    Boxes,
    GitBranch,
    ClipboardList,
    ShoppingCart,
    PieChart,
    Settings,
    ShieldCheck,
    History
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import React from "react"
import { useAuth, hasModuleAccess } from "@/hooks/use-auth"

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
    {
        name: "CRM",
        href: "/dashboard/crm",
        icon: Users2,
        children: [
            { name: "Overview", hash: "", href: "/dashboard/crm", icon: LayoutDashboard },
            { name: "Contacts", hash: "contacts", href: "/dashboard/crm/contacts", icon: Contact },
            { name: "Companies", hash: "companies", href: "/dashboard/crm/companies", icon: Building2 },
            { name: "Leads", hash: "leads", href: "/dashboard/crm/leads", icon: UserPlus },
            { name: "Deals", hash: "deals", href: "/dashboard/crm/deals", icon: Handshake },
            { name: "Opportunities", hash: "opportunities", href: "/dashboard/crm/opportunities", icon: Lightbulb },
            { name: "Activities", hash: "activities", href: "/dashboard/crm/activities", icon: CalendarClock },
            { name: "Emails", hash: "emails", href: "/dashboard/crm/emails", icon: Mail },
        ],
    },
    // {
    //     name: "Sales",
    //     href: "/dashboard/sales",
    //     icon: ShoppingCart,
    //     children: [
    //         { name: "Quotations", hash: "quotations", href: "/dashboard/sales", icon: FileText },
    //         { name: "Sales Orders", hash: "orders", href: "/dashboard/sales/orders", icon: ClipboardList }
    //     ],
    // },
    // {
    //     name: "Production",
    //     href: "/dashboard/production",
    //     icon: Factory,
    //     children: [
    //         { name: "Overview", hash: "", href: "/dashboard/production", icon: LayoutDashboard },
    //         { name: "Products", hash: "products", href: "/dashboard/production/products", icon: Boxes },
    //         { name: "Bill of Materials", hash: "bom", href: "/dashboard/production/bom", icon: GitBranch },
    //         { name: "Orders", hash: "orders", href: "/dashboard/production/orders", icon: ClipboardList },
    //     ],
    // },
    // {
    //     name: "Procurement",
    //     href: "/dashboard/procurement",
    //     icon: ShoppingCart,
    //     children: [
    //         { name: "Overview", hash: "", href: "/dashboard/procurement", icon: LayoutDashboard },
    //         { name: "Suppliers", hash: "suppliers", href: "/dashboard/procurement/suppliers", icon: Users2 },
    //         { name: "Purchase Orders", hash: "orders", href: "/dashboard/procurement/orders", icon: ClipboardList },
    //     ],
    // },
    {
        name: "Inventory (MRP Easy)",
        href: "/dashboard/mrp/dashboard",
        icon: Boxes,
        children: [
            { name: "MRP Dashboard", hash: "", href: "/dashboard/mrp/dashboard", icon: LayoutDashboard },
            { name: "MRP CRM", hash: "crm", href: "/dashboard/mrp/crm", icon: Users2 },
            { name: "MRP Production", hash: "production", href: "/dashboard/mrp/production", icon: Factory },
            { name: "MRP Stock", hash: "stock", href: "/dashboard/mrp/inventory", icon: Package },
            { name: "MRP Procurement", hash: "procurement", href: "/dashboard/mrp/procurement", icon: ShoppingCart },
        ],
    },
    // { name: "Orders", href: "/dashboard/orders", icon: ListOrdered },
    // {
    //     name: "Reports",
    //     href: "/dashboard/reports",
    //     icon: PieChart,
    //     children: [
    //         { name: "Overview", hash: "", href: "/dashboard/reports", icon: LayoutDashboard },
    //         { name: "Sales", hash: "sales", href: "/dashboard/reports/sales", icon: TrendingUp },
    //         { name: "Inventory", hash: "inventory", href: "/dashboard/reports/inventory", icon: Package },
    //         { name: "Production", hash: "production", href: "/dashboard/reports/production", icon: Factory },
    //         { name: "Finance", hash: "finance", href: "/dashboard/reports/finance", icon: FileText },
    //     ],
    // },
    {
        name: "Administration",
        href: "/dashboard/admin",
        icon: Settings,
        children: [
            { name: "Overview", hash: "", href: "/dashboard/admin", icon: LayoutDashboard },
            { name: "Users", hash: "users", href: "/dashboard/admin/users", icon: Users2 },
            { name: "Audit Log", hash: "audit-log", href: "/dashboard/admin/audit-log", icon: History },
            { name: "Settings", hash: "settings", href: "/dashboard/admin/settings", icon: Settings },
        ],
    },
    // { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
    // { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

const navItemModuleMap: Record<string, string> = {
    "Overview": "dashboard",
    "AI Analytics": "ai_analytics",
    "CRM": "crm",
    "Orders": "orders",
    "Sales": "sales",
    "Inventory (MRP Easy)": "inventory",
    "Production": "production",
    "Procurement": "procurement",
    "Reports": "reports",
    "Administration": "admin",
}

export function AppSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [activeHash, setActiveHash] = React.useState("");
    const auth = useAuth();

    const filteredNavItems = navItems.filter(item => {
        const moduleKey = navItemModuleMap[item.name];
        if (!moduleKey) return true; // No mapping = always show
        return hasModuleAccess(auth, moduleKey);
    });

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
                            {filteredNavItems.map((item) => {
                                const isOverview = item.href === '/dashboard';
                                const isActive = isOverview ?
                                    pathname === '/dashboard' :
                                    pathname === item.href || pathname.startsWith(item.href + '/') ||
                                    (item.children?.some(c => 'href' in c && (pathname === (c as any).href || pathname.startsWith((c as any).href + '/'))))
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
                                                    const isChildActive = isActive && (
                                                        "href" in child
                                                            ? pathname === (child as any).href
                                                            : resolvedActiveHash === child.hash
                                                    );
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
                                                                    href={"href" in child ? (child as any).href : `${item.href}#${child.hash}`}
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
