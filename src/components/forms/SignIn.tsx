'use client'
// Import global from third party libraries.
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Input } from "../ui/input"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export const SignIn = () => {
    // SECTION: States
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter();
    // !SECTION

    // SECTION: Functions
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password) return;

        // Dummy login: store a fake auth payload and route to dashboard.
        const authData = {
            isLoggedIn: true,
            token: "dummy-token",
            user: {
                email: formData.email,
                role: "USER",
            },
            role: "USER",
        };

        try {
            localStorage.setItem("auth", JSON.stringify(authData));
        } catch {
            // Ignore storage errors (private mode, disabled storage, etc.)
        }
        router.push('/dashboard');
        window.dispatchEvent(new Event('authChange'));
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
                    <p className="text-sm font-medium text-muted-foreground lg:hidden">
                        Vaclift
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Login to your account
                    </h1>
                    <p className="text-muted-foreground text-sm text-balance">
                        Enter your email below to login to your account
                    </p>
                </div>
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
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                                showPassword ? "Hide password" : "Show password"
                            }
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
                    <Button type="submit" className="w-full" size="lg">
                        Login
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    )
    // !SECTION
}
