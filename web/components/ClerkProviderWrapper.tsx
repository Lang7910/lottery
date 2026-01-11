"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { zhCN } from "@clerk/localizations";
import { ReactNode } from "react";

interface ClerkProviderWrapperProps {
    children: ReactNode;
}

export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
    // 在客户端渲染时才加载 ClerkProvider
    // 这样可以避免在构建时因为没有 publishableKey 而失败
    return (
        <ClerkProvider localization={zhCN}>
            {children}
        </ClerkProvider>
    );
}
