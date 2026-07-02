import { prisma } from "@/lib/prisma";
import WakalaSelectionPage from "./WakalaSelectionPage";

/**
 * Page d'accueil - Sélection de Wakala
 * Flux: Accueil → Sélectionner Wakala → Login → Dashboard
 */
export default async function HomePage() {
  try {
    // Récupérer toutes les Wakalas actives
    const wakalas = await prisma.tenant.findMany({
      where: {
        active: true,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        phone: true,
        createdAt: true,
      },
    });

    return <WakalaSelectionPage wakalas={wakalas} />;
  } catch (error) {
    console.error("❌ Error loading wakalas:", error);

    // Afficher un message d'erreur plus explicite
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF0DC] p-4">
        <div className="bg-white rounded-[14px] shadow-xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Erreur de Migration
          </h1>
          <p className="text-gray-600 mb-6">
            La table Tenant n'a pas été trouvée. Veuillez vérifier que la migration multi-tenant a été appliquée correctement.
          </p>
          <div className="bg-gray-50 p-4 rounded-[9px] text-left text-sm mb-6">
            <p className="font-mono text-xs text-gray-700">
              {error instanceof Error ? error.message : "Erreur inconnue"}
            </p>
          </div>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-[#C17A2B] text-white rounded-[9px] hover:bg-[#8B4A0F] transition-colors"
          >
            Aller au Login
          </a>
        </div>
      </div>
    );
  }
}
