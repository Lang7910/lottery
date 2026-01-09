"use client";

import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { Dice5 } from "lucide-react";

interface NavbarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const tabs = [
    { id: "ssq", label: "双色球" },
    { id: "dlt", label: "大乐透" },
];

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Dice5 className="w-7 h-7 text-primary" />
                        <span className="text-lg font-semibold text-foreground">
                            彩票分析
                        </span>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={cn(
                                    "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                                    activeTab === tab.id
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Theme Toggle */}
                    <ThemeToggle />
                </div>
            </div>
        </nav>
    );
}
