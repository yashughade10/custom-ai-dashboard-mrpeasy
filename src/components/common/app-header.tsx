'use client';

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
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

function AppHeader() {
    const { user } = useAuth();

    const router = useRouter();

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

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
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
        </div>
    );
}

export default AppHeader;
