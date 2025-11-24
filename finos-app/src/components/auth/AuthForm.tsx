"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Chrome, Smartphone, Mail, Lock, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AuthFormProps {
    type: "login" | "register";
}

export function AuthForm({ type }: AuthFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");

    // Form States
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [showOtpInput, setShowOtpInput] = useState(false);

    const supabase = createClient();

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${location.origin}/auth/callback`,
            },
        });
        if (error) {
            console.error(error);
            alert(error.message);
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Sign up with email and password
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    phone: phone,
                },
            },
        });

        if (error) {
            alert(error.message);
        } else {
            alert("Registration successful!");
            router.push("/onboarding");
        }
        setIsLoading(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (authMethod === "password") {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) {
                alert(error.message);
                setIsLoading(false);
            } else {
                router.push("/dashboard");
            }
        } else {
            // Mobile OTP Login
            if (!showOtpInput) {
                const { error } = await supabase.auth.signInWithOtp({
                    phone: phone,
                });
                if (error) {
                    alert(error.message);
                    setIsLoading(false);
                } else {
                    setShowOtpInput(true);
                    setIsLoading(false);
                }
            } else {
                const { error } = await supabase.auth.verifyOtp({
                    phone: phone,
                    token: otp,
                    type: "sms",
                });
                if (error) {
                    alert(error.message);
                    setIsLoading(false);
                } else {
                    router.push("/dashboard");
                }
            }
        }
    };

    return (
        <Card className="w-[400px] bg-gray-900 border-gray-800 text-white">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                    {type === "login" ? "Welcome back" : "Create an account"}
                </CardTitle>
                <CardDescription className="text-center text-gray-400">
                    {type === "login"
                        ? "Login with Google, Email, or Mobile OTP"
                        : "Enter your details to create your account"}
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                {/* Google Login - Always Visible */}
                <Button variant="outline" onClick={handleGoogleLogin} disabled={isLoading} className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700 text-white">
                    <Chrome className="mr-2 h-4 w-4" />
                    Continue with Google
                </Button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-gray-900 px-2 text-gray-400">Or continue with</span>
                    </div>
                </div>

                {type === "login" && (
                    <Tabs defaultValue="password" onValueChange={(v) => setAuthMethod(v as "password" | "otp")} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                            <TabsTrigger value="password">Email & Pass</TabsTrigger>
                            <TabsTrigger value="otp">Mobile OTP</TabsTrigger>
                        </TabsList>

                        <TabsContent value="password">
                            <form onSubmit={handleLogin} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        className="bg-gray-800 border-gray-700 text-white"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        className="bg-gray-800 border-gray-700 text-white"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700" type="submit" disabled={isLoading}>
                                    {isLoading ? "Logging in..." : "Sign In"}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="otp">
                            <form onSubmit={handleLogin} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+91 98765 43210"
                                        className="bg-gray-800 border-gray-700 text-white"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        disabled={showOtpInput}
                                        required
                                    />
                                </div>
                                {showOtpInput && (
                                    <div className="space-y-2">
                                        <Label htmlFor="otp">OTP</Label>
                                        <Input
                                            id="otp"
                                            type="text"
                                            placeholder="123456"
                                            className="bg-gray-800 border-gray-700 text-white"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700" type="submit" disabled={isLoading}>
                                    {isLoading ? "Processing..." : showOtpInput ? "Verify & Login" : "Send OTP"}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                )}

                {type === "register" && (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                className="bg-gray-800 border-gray-700 text-white"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                className="bg-gray-800 border-gray-700 text-white"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Mobile Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+91 98765 43210"
                                className="bg-gray-800 border-gray-700 text-white"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                className="bg-gray-800 border-gray-700 text-white"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button className="w-full bg-indigo-600 hover:bg-indigo-700" type="submit" disabled={isLoading}>
                            {isLoading ? "Creating Account..." : "Create Account"}
                        </Button>
                    </form>
                )}
            </CardContent>
            <CardFooter>
                <p className="text-center text-sm text-gray-400 w-full">
                    {type === "login" ? "Don't have an account? " : "Already have an account? "}
                    <Link href={type === "login" ? "/register" : "/login"} className="underline text-indigo-400 hover:text-indigo-300">
                        {type === "login" ? "Sign up" : "Sign in"}
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
