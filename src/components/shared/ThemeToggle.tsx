"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const subscribeToClient = () => () => undefined;

export function ThemeToggle({ premium = false }: { premium?: boolean }) {
    const { resolvedTheme, setTheme } = useTheme();
    const mounted = useSyncExternalStore(
        subscribeToClient,
        () => true,
        () => false
    );

    // Le serveur ne connaÃ®t pas le thÃ¨me stockÃ© dans le navigateur. Garder
    // des attributs neutres jusqu'au montage empÃªche un mismatch d'hydratation.
    const isDark = mounted && resolvedTheme === "dark";
    const accessibleLabel = mounted
        ? isDark ? "Activer le mode clair" : "Activer le mode sombre"
        : "Changer le thÃ¨me";

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className={premium
                ? "relative h-10 w-10 rounded-full border border-[#d8c8b2] bg-white/75 text-[#6d481d] hover:bg-white dark:border-[#5b4027] dark:bg-[#17120d] dark:text-[#e6a73c] dark:hover:bg-[#2b1d10]"
                : "h-10 w-10 rounded-full"}
            aria-label={accessibleLabel}
            title={mounted ? isDark ? "Mode clair" : "Mode sombre" : "Changer le thÃ¨me"}
        >
            <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Changer le thème</span>
        </Button>
    );
}
