"use client";

import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config";
import { useLocale } from "@/contexts/LocaleContext";
import { cn } from "@/lib/utils";

const localeCodes: Record<Locale, string> = { fr: "FR", ar: "AR", en: "EN" };

export function LanguageSwitcher() {
    const { locale: currentLocale, setLocale } = useLocale();

    const handleLocaleChange = (newLocale: Locale) => {
        setLocale(newLocale);
        // Plus besoin de reload ! Le contexte gère tout 🎉
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-md hover:bg-muted dark:hover:bg-[#2b1d10]"
                    title={`${localeFlags[currentLocale]} ${localeNames[currentLocale]}`}
                >
                    <Globe className="h-5 w-5 text-foreground dark:text-[#e6a73c]" />
                    <span className="sr-only">Changer de langue</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-xl border-[#d9c9b3] bg-[#fffaf3] p-1.5 text-[#3d2a18] shadow-2xl dark:border-[#5b4027] dark:bg-[#17120d] dark:text-[#f4eadc]">
                {locales.map((locale) => (
                    <DropdownMenuItem
                        key={locale}
                        onClick={() => handleLocaleChange(locale)}
                        className={cn(
                            "mb-1 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 last:mb-0 focus:bg-[#f2e4cf] focus:text-[#3d2a18] dark:focus:bg-[#352516] dark:focus:text-white",
                            currentLocale === locale && "bg-[#f4e6cf] text-[#3d2a18] dark:bg-[#3a2816] dark:text-[#f7dfb7]"
                        )}
                    >
                        <span className="flex h-7 w-8 shrink-0 items-center justify-center rounded-md border border-[#d8c5a8] bg-card/70 text-[10px] font-bold tracking-wide text-[#75512b] dark:border-[#654827] dark:bg-black/20 dark:text-[#e4b662]">
                            {localeCodes[locale]}
                        </span>
                        <span className="min-w-0 flex-1 font-medium">{localeNames[locale]}</span>
                        {currentLocale === locale && (
                            <Check className="h-4 w-4 shrink-0 text-[#b76d17] dark:text-[#f0b548]" />
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
