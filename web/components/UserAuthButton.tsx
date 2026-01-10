"use client";

import { useAuth, useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { LogIn, User } from "lucide-react";
import { useEffect } from "react";
import { API_BASE_URL } from "@/lib/utils";

export function UserAuthButton() {
    const { isSignedIn, userId } = useAuth();
    const { user } = useUser();

    // 同步用户到后端数据库
    useEffect(() => {
        if (isSignedIn && userId && user) {
            fetch(`${API_BASE_URL}/api/betting/user/sync`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    clerk_id: userId,
                    email: user.primaryEmailAddress?.emailAddress,
                    username: user.username || user.firstName || "用户",
                }),
            }).catch(console.error);
        }
    }, [isSignedIn, userId, user]);

    if (!isSignedIn) {
        return (
            <SignInButton mode="modal">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <LogIn className="w-4 h-4" />
                    登录
                </button>
            </SignInButton>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <UserButton
                afterSignOutUrl="/"
                appearance={{
                    elements: {
                        avatarBox: "w-8 h-8",
                    }
                }}
            />
        </div>
    );
}
