import * as React from "react"

type Role = "Admin" | "User" | "Guest";

interface AuthState {
    isLoggedIn: boolean;
    token: string;
    user: any;
    role: Role;
}

export function useAuth(): AuthState {
    const [auth, setAuth] = React.useState<AuthState>(() => {
        // Lazy initialization - load from localStorage on mount
        if (typeof window !== 'undefined') {
            const storedAuth = localStorage.getItem('auth');
            if (storedAuth) {
                return JSON.parse(storedAuth);
            }
        }
        return {
            isLoggedIn: false,
            token: '',
            role: undefined as any,
            user: null
        };
    });

    const loadAuth = React.useCallback(() => {
        const storedAuth = localStorage.getItem('auth');
        if (storedAuth) {
            setAuth(JSON.parse(storedAuth));
        } else {
            setAuth({
                isLoggedIn: false,
                token: '',
                role: undefined as any,
                user: null
            });
        }
    }, []);

    React.useEffect(() => {
        loadAuth();

        // Listen for custom login event
        const handleAuthChange = () => {
            loadAuth();
        };

        window.addEventListener('authChange', handleAuthChange);

        return () => {
            window.removeEventListener('authChange', handleAuthChange);
        };
    }, [loadAuth])

    return auth;
}