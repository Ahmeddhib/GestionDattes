import Link from "next/link";
import { ROUTES } from "@/lib/routes";

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">403</h1>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                    Accès non autorisé
                </h2>
                <p className="text-gray-600 mb-8">
                    Vous n'avez pas les permissions nécessaires pour accéder à cette
                    page.
                </p>
                <Link
                    href={ROUTES.DASHBOARD}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    Retour au dashboard
                </Link>
            </div>
        </div>
    );
}
