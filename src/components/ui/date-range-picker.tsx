"use client"

import * as React from "react"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateRangePickerProps {
    value: DateRange | undefined;
    onChange: (range: DateRange | undefined) => void;
    placeholder?: string;
    className?: string;
}

export function DateRangePicker({ value, onChange, placeholder, className }: DateRangePickerProps) {
    const label = React.useMemo(() => {
        if (!value?.from) return placeholder ?? "Sélectionner une période";
        if (!value.to || value.to.getTime() === value.from.getTime()) {
            return format(value.from, "dd MMM yyyy", { locale: fr });
        }
        return `${format(value.from, "dd MMM yyyy", { locale: fr })} - ${format(value.to, "dd MMM yyyy", { locale: fr })}`;
    }, [value, placeholder]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        "justify-start gap-2 rounded-sm border-border text-left font-normal",
                        !value?.from && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="h-4 w-4 text-[#C17A2B]" />
                    <span className="truncate">{label}</span>
                    {value?.from && (
                        <span
                            role="button"
                            tabIndex={-1}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(undefined);
                            }}
                            className="ml-auto rounded-full p-0.5 hover:bg-[#FAF0DC]"
                        >
                            <X className="h-3.5 w-3.5" />
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto bg-white p-0" align="start">
                <Calendar
                    mode="range"
                    defaultMonth={value?.from}
                    selected={value}
                    onSelect={onChange}
                    numberOfMonths={2}
                />
            </PopoverContent>
        </Popover>
    );
}
