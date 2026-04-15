"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not authenticated, redirect to login
                router.push("/login");
            } else if (userProfile && (userProfile.role !== "admin" && userProfile.role !== "super_admin")) {
                // Authenticated but not admin or super_admin, redirect to dashboard
                router.push("/dashboard");
            }
        }
    }, [user, userProfile, loading, router]);

    // Show loading spinner while checking auth or if not authorized (to prevent white page during redirect)
    if (loading || !user || !userProfile || (userProfile.role !== "admin" && userProfile.role !== "super_admin")) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6]">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#059669]"></div>
                    <p className="mt-4 text-[#6b7280]">Verifying Admin Access...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
