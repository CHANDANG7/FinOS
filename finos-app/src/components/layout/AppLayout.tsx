"use client";

import { usePathname } from 'next/navigation';
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isAuthPage = ['/login', '/register', '/onboarding'].includes(pathname);

    if (isAuthPage) {
        return (
            <main className="h-full bg-[#0a0a0a]">
                {children}
            </main>
        );
    }

    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                <Sidebar />
            </div>
            <main className="md:pl-72 h-full bg-[#0a0a0a]">
                {children}
            </main>
        </div>
    );
}
