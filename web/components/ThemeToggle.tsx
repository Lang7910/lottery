"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                <span className="sr-only">切换主题</span>
            </button>
        );
    }

    const isDark = theme === "dark";

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center",
                "bg-muted hover:bg-border transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            )}
            aria-label={isDark ? "切换到浅色模式" : "切换到深色模式"}
        >
            {isDark ? (
                <Sun className="w-5 h-5 text-foreground" />
            ) : (
                <Moon className="w-5 h-5 text-foreground" />
            )}
        </button>
    );
}
