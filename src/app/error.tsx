"use client";

import { useEffect } from "react";
import { Button } from "@/components/shared/Button";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Application error:", error);
        toast.error("Une erreur est survenue", {
            description: "Veuillez réessayer. Si le problème persiste, vérifiez votre connexion.",
        });
    }, [error]);

    return (
        <div className="min-h-screen bg-sand flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full text-center">
                <div className="w-16 h-16 rounded-lg bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                    Une erreur est survenue
                </h2>
                <p className="text-muted-foreground mb-6">
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
