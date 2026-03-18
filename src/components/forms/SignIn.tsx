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

        // setLocalStorageItem('auth', JSON.stringify(authData));
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
        <form onSubmit={handleLogin} className={cn("flex flex-col gap-6")}>
            <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Login to your account</h1>
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
                        value={formData.email}
                        onChange={handleChange}
                    />
                </Field>
                <Field>
                    <div className="flex items-center">
                        <FieldLabel htmlFor="password">Password</FieldLabel>
                        <a
                            href="#"
                            className="ml-auto text-sm underline-offset-4 hover:underline"
                        >
                            Forgot your password?
                        </a>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="********"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                    <Button type="submit">Login</Button>
                </Field>
            </FieldGroup>
        </form>
    )
    // !SECTION
}
