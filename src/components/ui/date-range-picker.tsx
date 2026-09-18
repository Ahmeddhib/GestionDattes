"use client"

import * as React from "react"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { ar, enUS, fr } from "date-fns/locale"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import { useClientTranslations } from "@/hooks/useClientTranslations"

interface DateRangePickerProps {
    value: DateRange | undefined;
    onChange: (range: DateRange | undefined) => void;
    placeholder?: string;
    className?: string;
    commitMode?: "instant" | "apply";
    applyLabel?: string;
    clearLabel?: string;
}

export function DateRangePicker({
    value,
    onChange,
    placeholder,
    className,
    commitMode = "instant",
    applyLabel = "Appliquer",
    clearLabel = "Reinitialiser",
}: DateRangePickerProps) {
    const isMobile = useIsMobile();
    const { locale } = useClientTranslations();
    const calendarLocale = locale === "ar" ? ar : locale === "en" ? enUS : fr;
    const [open, setOpen] = React.useState(false);
    const [draft, setDraft] = React.useState<DateRange | undefined>(value);
    const label = React.useMemo(() => {
        if (!value?.from) return placeholder ?? "Sélectionner une période";
        if (!value.to || value.to.getTime() === value.from.getTime()) {
            return format(value.from, "dd MMM yyyy", { locale: calendarLocale });
        }
        return `${format(value.from, "dd MMM yyyy", { locale: calendarLocale })} - ${format(value.to, "dd MMM yyyy", { locale: calendarLocale })}`;
    }, [calendarLocale, value, placeholder]);

    const deferred = commitMode === "apply";
    const selected = deferred ? draft : value;

    const changeOpen = (nextOpen: boolean) => {
        if (nextOpen) setDraft(value);
        setOpen(nextOpen);
    };

    return (
        <Popover open={open} onOpenChange={changeOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        "w-full min-w-0 justify-start gap-2 rounded-xl border-border bg-background/75 text-start font-normal sm:w-auto",
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
                            className="ms-auto rounded-full p-0.5 hover:bg-muted"
                        >
                            <X className="h-3.5 w-3.5" />
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="max-w-[calc(100vw-1rem)] overflow-x-auto p-0" align="start">
                <Calendar
                    mode="range"
                    defaultMonth={selected?.from}
                    selected={selected}
                    onSelect={deferred ? setDraft : onChange}
                    numberOfMonths={isMobile ? 1 : 2}
                    locale={calendarLocale}
                />
                {deferred && (
                    <div className="flex items-center justify-end gap-2 border-t border-border p-3">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setDraft(undefined)}>
                            {clearLabel}
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                                onChange(draft);
                                setOpen(false);
                            }}
                        >
                            {applyLabel}
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
