// import AppHeader from "@/components/menus/app-header"
import AppHeader from "@/components/common/app-header"
import { AppSidebar } from "@/components/common/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
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
