"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { zhCN } from "@clerk/localizations";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ReactNode } from "react";

interface ClientLayoutProps {
    children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
    return (
        <ClerkProvider localization={zhCN}>
            <ThemeProvider>
                {children}
            </ThemeProvider>
        </ClerkProvider>
    );
}
