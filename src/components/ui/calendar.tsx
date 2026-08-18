"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { fr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = fr,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={locale}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium text-foreground",
        nav: "flex items-center gap-1 absolute inset-x-0 justify-between",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-8 bg-transparent p-0 opacity-70 hover:opacity-100 border-border"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-8 bg-transparent p-0 opacity-70 hover:opacity-100 border-border"
        ),
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal aria-selected:opacity-100 hover:bg-muted"
        ),
        range_start: "bg-[#C17A2B] text-white rounded-l-md",
        range_end: "bg-[#C17A2B] text-white rounded-r-md",
        range_middle: "bg-muted text-foreground",
        selected:
          "bg-[#C17A2B] text-white hover:bg-[#C17A2B] hover:text-white focus:bg-[#C17A2B] focus:text-white rounded-md",
        today: "bg-muted text-foreground rounded-lg",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...chevronProps }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" {...chevronProps} />
          ) : (
            <ChevronRight className="size-4" {...chevronProps} />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }
