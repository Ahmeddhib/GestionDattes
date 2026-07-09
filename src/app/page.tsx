import { redirect } from "next/navigation";

/**
 * Page d'accueil - Redirection vers Login
 * Flux: Accueil → Login → Sélection Wakala → Dashboard
 */
export default function HomePage() {
  // Rediriger immédiatement vers la page de login
  redirect("/login");
}
