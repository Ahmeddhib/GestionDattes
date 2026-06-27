"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    className,
}: PaginationProps) {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    // Show max 7 pages at a time
    const getVisiblePages = () => {
        if (totalPages <= 7) return pages;

        if (currentPage <= 4) {
            return [...pages.slice(0, 5), "...", totalPages];
        }

        if (currentPage >= totalPages - 3) {
            return [1, "...", ...pages.slice(totalPages - 5)];
        }

        return [
            1,
            "...",
            currentPage - 1,
            currentPage,
            currentPage + 1,
            "...",
            totalPages,
        ];
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="w-4 h-4" />
            </Button>

            {getVisiblePages().map((page, index) =>
                page === "..." ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                        ...
                    </span>
                ) : (
                    <Button
                        key={page}
                        variant={currentPage === page ? "primary" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(page as number)}
                    >
                        {page}
                    </Button>
                )
            )}

            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                <ChevronRight className="w-4 h-4" />
            </Button>
        </div>
    );
}
