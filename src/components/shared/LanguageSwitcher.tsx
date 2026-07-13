"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config";
import { useLocale } from "@/contexts/LocaleContext";

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
                    className="h-9 w-9 rounded-[9px] hover:bg-[#FAF0DC]"
                    title={`${localeFlags[currentLocale]} ${localeNames[currentLocale]}`}
                >
                    <Globe className="h-5 w-5 text-[#3D1C00]" />
                    <span className="sr-only">Changer de langue</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white">
                {locales.map((locale) => (
                    <DropdownMenuItem
                        key={locale}
                        onClick={() => handleLocaleChange(locale)}
                        className={`cursor-pointer ${currentLocale === locale ? "bg-[#FAF0DC]" : ""
                            }`}
                    >
                        <span className="mr-2 text-lg">{localeFlags[locale]}</span>
                        <span>{localeNames[locale]}</span>
                        {currentLocale === locale && (
                            <span className="ml-auto text-[#C17A2B]">✓</span>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
