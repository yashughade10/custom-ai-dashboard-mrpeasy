'use client'
// Import global from third party libraries.
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Input } from "../ui/input"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CircleAlert, Eye, EyeOff } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { loginDashboard } from "@/services/api"
import { setLocalStorageItem } from "@/lib/local-storage"

export const SignIn = () => {
    // SECTION: States
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter();
    // !SECTION

    const { mutate, isPending, error } = useMutation({
        mutationFn: ({ email, password }: { email: string, password: string }) =>
            loginDashboard(email, password),
        onSuccess: (data) => {
            console.log('info', `Login response: ${JSON.stringify(data)}`);
            if (!data || !data.token) {
                console.error('error: ', 'Invalid response structure: missing token');
                return;
            }

            const authData = {
                isLoggedIn: true,
                token: data.token,
                user: data.user || null,
                role: data.user?.role || 'USER',
            };

            console.log('info', `Storing auth data: ${JSON.stringify(authData)}`);
            setLocalStorageItem('auth', JSON.stringify(authData));

            router.push('/dashboard');

            // Trigger auth change event to update all components
            window.dispatchEvent(new Event('authChange'));
        },
        onError: (error) => {
            console.log('error', `Login error: ${error.message || error}`);
        }
    })

    const errorMessage =
        error instanceof Error ? error.message : (typeof error === "string" ? error : null)

    // SECTION: Functions
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password) return;

        if (formData.email && formData.password) {
            mutate({ email: formData.email, password: formData.password });
        }
    }
    // !SECTION

    // SECTION: Event handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        })
    }
    // !SECTION

    // SECTION: Return UI
    return (
        <form
            onSubmit={handleLogin}
            className={cn("flex w-full flex-col gap-6")}
        >
            <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                    {/* <p className="text-sm font-medium text-muted-foreground lg:hidden">
                        Vaclift
                    </p> */}
                    <img src="https://www.vacliftaustralia.com/logo/navlogo.png" alt="logo" className="h-10 sm:h-12 lg:h-[3.6vw]" />
                    <h1 className="text-2xl font-bold tracking-tight">
                        Login to your account
                    </h1>
                    <p className="text-muted-foreground text-sm text-balance">
                        Enter your email below to login to your account
                    </p>
                </div>

                {errorMessage ? (
                    <p className="text-sm text-red-600 flex justify-center items-center gap-2" role="alert">
                        <CircleAlert size={16} />
                        {errorMessage}
                    </p>
                ) : null}

                <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                        id="email"
                        type="email"
                        placeholder="me@example.com"
                        autoComplete="email"
                        inputMode="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        disabled={isPending}
                    />
                </Field>
                <Field>
                    <div className="flex items-center">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <a
                            href="#"
                            className="ml-auto text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        >
                            Forgot your password?
                        </a>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="********"
                            autoComplete="current-password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isPending}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                                showPassword ? "Hide password" : "Show password"
                            }
                            disabled={isPending}
                            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {showPassword ? (
                                <EyeOff size={18} />
                            ) : (
                                <Eye size={18} />
                            )}
                        </button>
                    </div>
                </Field>
                <Field>
                    <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                        {isPending ? "Logging in..." : "Login"}
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    )
    // !SECTION
}
