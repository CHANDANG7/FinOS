import { AuthForm } from "@/components/auth/AuthForm";

export default function RegisterPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
            <AuthForm type="register" />
        </div>
    );
}
