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
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Settings,
    LogOut,
    ListOrdered,
    Sparkles,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "AI Analytics", href: "/dashboard/ai-analytics", icon: Sparkles },
    { name: "Orders", href: "/dashboard/orders", icon: ListOrdered },
    // { name: "Announcements", href: "/dashboard/announcements", icon: Megaphone },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function AppSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        router.replace("/login");
    }

    return (
        <Sidebar className="border-r-0">
            <SidebarHeader className="px-5 py-[14px]">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <span className="text-sm font-bold">V</span>
                    </div>
                    <span className="text-lg font-bold tracking-tight">Vaclifts</span>
                </Link>
            </SidebarHeader>
            <SidebarSeparator />
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
                                                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                                                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                                            )}
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="h-[18px] w-[18px] shrink-0" />
                                                <span>{item.name}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarSeparator />
            <SidebarFooter className="px-5 py-4">
                <SidebarMenu className="mt-3">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={handleLogout}
                            className={cn(
                                "text-sm px-3 h-10 rounded-lg transition-all duration-150 gap-3",
                                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
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
