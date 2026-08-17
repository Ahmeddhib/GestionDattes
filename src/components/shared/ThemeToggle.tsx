"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ premium = false }: { premium?: boolean }) {
    const { resolvedTheme, setTheme } = useTheme();
    const isDark = resolvedTheme !== "light";

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={premium
                ? "relative h-10 w-10 rounded-full border border-[#d8c8b2] bg-white/75 text-[#6d481d] hover:bg-white dark:border-[#5b4027] dark:bg-[#17120d] dark:text-[#e6a73c] dark:hover:bg-[#2b1d10]"
                : "h-10 w-10 rounded-full"}
            aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
            title={isDark ? "Mode clair" : "Mode sombre"}
        >
            <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Changer le thème</span>
        </Button>
    );
}
