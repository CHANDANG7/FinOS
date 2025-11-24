import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
            <AuthForm type="login" />
        </div>
    );
}
