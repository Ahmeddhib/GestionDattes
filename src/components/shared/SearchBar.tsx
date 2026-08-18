"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface SearchBarProps {
    placeholder?: string;
    onSearch: (value: string) => void;
    debounceMs?: number;
    className?: string;
}

export function SearchBar({
    placeholder = "Rechercher...",
    onSearch,
    debounceMs = 300,
    className,
}: SearchBarProps) {
    const [value, setValue] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(value);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [value, debounceMs, onSearch]);

    return (
        <div className={className}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a876f] rtl:left-auto rtl:right-3" />
                <Input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="h-10 rounded-xl border-[#dfcfb9] bg-card/80 pl-10 focus:border-dattes-400 focus:ring-dattes-400 dark:border-[#5b4027] dark:bg-[#17120d]/80 rtl:pl-3 rtl:pr-10"
                />
            </div>
        </div>
    );
}
