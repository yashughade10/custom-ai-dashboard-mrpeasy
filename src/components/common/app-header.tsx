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
                        <AvatarImage src={user.image} alt={user.name} />
                        <AvatarFallback>
                            {user.name.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                        <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-sm text-muted-foreground">
                                {user.email}
                            </span>
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