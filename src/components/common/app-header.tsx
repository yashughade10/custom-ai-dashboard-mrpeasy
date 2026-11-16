'use client';

import * as React from 'react';

import { SidebarTrigger } from '../ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { removeLocalStorageItem } from '@/lib/local-storage';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import GlobalSearch from './GlobalSearch';
import CreateLeadDialog from '@/components/crm/CreateLeadDialog';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

function AppHeader() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const [createLeadOpen, setCreateLeadOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Only show CTA in the main header when navigating to the CRM section/tab of sidebar
    const isCrmSection = Boolean(pathname && pathname.startsWith('/dashboard/crm'));

    const userName = user?.name ?? "Guest";
    const userEmail = user?.email ?? "";
    const userInitial = typeof userName === "string" && userName.length > 0 ? userName.charAt(0) : "?";

    const handleLogout = () => {
        removeLocalStorageItem("auth");
        router.replace("/");
    };

    return (
        <div className='flex justify-between items-center p-4 border-b'>
            <SidebarTrigger className="-ml-1" />

            <div className="flex items-center gap-3">
                {/* Dynamic CRM CTA Button: Appears in main header ONLY when inside /dashboard/crm */}
                {isCrmSection && (
                    <Button
                        size="sm"
                        onClick={() => setCreateLeadOpen(true)}
                        className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm h-8 px-3 text-xs cursor-pointer animate-in fade-in-50 duration-200"
                        title="Add New Lead Manually"
                    >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Add Lead</span>
                        <span className="sm:hidden">New</span>
                    </Button>
                )}

                <GlobalSearch />

                {mounted ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger className="outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full">
                            <Avatar className="cursor-pointer">
                                {/* <AvatarImage src={user.image} alt={user.name} /> */}
                                <AvatarFallback>
                                    {userInitial}
                                </AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col">
                                    <span className="font-medium">{userName}</span>
                                    {userEmail ? (
                                        <span className="text-sm text-muted-foreground">{userEmail}</span>
                                    ) : null}
                                </div>
                            </DropdownMenuLabel>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={handleLogout}
                                className="cursor-pointer text-red-500"
                            >
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Avatar className="cursor-pointer opacity-50">
                        <AvatarFallback>{userInitial}</AvatarFallback>
                    </Avatar>
                )}
            </div>

            {/* Manual Lead Creation Dialog */}
            {isCrmSection && (
                <CreateLeadDialog
                    open={createLeadOpen}
                    onOpenChange={setCreateLeadOpen}
                />
            )}
        </div>
    );
}

export default AppHeader;
