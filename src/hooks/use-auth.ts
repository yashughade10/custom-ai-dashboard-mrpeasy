import * as React from "react"

export type Role = "super_admin" | "admin" | "user";

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: Role;
    permissions: string[];
}

export interface AuthState {
    isLoggedIn: boolean;
    token: string;
    user: AuthUser | null;
    role: Role | undefined;
    permissions: string[];
}

export function useAuth(): AuthState {
    const [auth, setAuth] = React.useState<AuthState>({
        isLoggedIn: false,
        token: '',
        role: undefined,
        user: null,
        permissions: [],
    });

    const loadAuth = React.useCallback(() => {
        try {
            const storedAuth = localStorage.getItem('auth');
            if (storedAuth) {
                const parsed = JSON.parse(storedAuth);
                setAuth({
                    ...parsed,
                    permissions: parsed.user?.permissions || parsed.permissions || [],
                });
            } else {
                setAuth({
                    isLoggedIn: false,
                    token: '',
                    role: undefined,
                    user: null,
                    permissions: [],
                });
            }
        } catch {
            setAuth({
                isLoggedIn: false,
                token: '',
                role: undefined,
                user: null,
                permissions: [],
            });
        }
    }, []);

    React.useEffect(() => {
        loadAuth();

        const handleAuthChange = () => loadAuth();
        window.addEventListener('authChange', handleAuthChange);

        return () => window.removeEventListener('authChange', handleAuthChange);
    }, [loadAuth])

    return auth;
}

// Helper functions
export function hasModuleAccess(auth: AuthState, module: string): boolean {
    if (!auth.isLoggedIn) return false;
    if (auth.role === "super_admin") return true;
    return auth.permissions.includes(module);
}

export function isSuperAdmin(auth: AuthState): boolean {
    return auth.isLoggedIn && auth.role === "super_admin";
}