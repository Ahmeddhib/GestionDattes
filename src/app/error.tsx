"use client";

import { useEffect } from "react";
import { Button } from "@/components/shared/Button";
import { AlertTriangle } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Application error:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-sand flex items-center justify-center p-4">
            <div className="bg-white border border-[#F0E0C0] rounded-[14px] p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 rounded-[14px] bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-[#2C1A00] mb-2">
                    Une erreur est survenue
                </h2>
                <p className="text-gray-600 mb-6">
                    {error.message || "Désolé, quelque chose s'est mal passé."}
                </p>
                <div className="flex gap-3 justify-center">
                    <Button
                        variant="outline"
                        onClick={() => (window.location.href = "/")}
                    >
                        Retour à l'accueil
                    </Button>
                    <Button variant="primary" onClick={reset}>
                        Réessayer
                    </Button>
                </div>
            </div>
        </div>
    );
}
