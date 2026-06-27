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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="pl-10 rounded-[7px] border-[#F0E0C0] focus:border-dattes-400 focus:ring-dattes-400"
                />
            </div>
        </div>
    );
}
