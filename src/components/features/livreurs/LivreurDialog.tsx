"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createLivreurAction } from "@/actions/livreurs/create-livreur.action";
import { updateLivreurAction } from "@/actions/livreurs/update-livreur.action";
import { deleteLivreurAction } from "@/actions/livreurs/delete-livreur.action";
import type { Livreur } from "./columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

type FormValues = { nom: string; telephone: string; cin: string; vehicule: string; active: boolean };
const emptyForm: FormValues = { nom: "", telephone: "", cin: "", vehicule: "", active: true };

export function LivreurDialog({ livreur, open, onOpenChange, deleteMode = false }: { livreur?: Livreur | null; open?: boolean; onOpenChange?: (open: boolean) => void; deleteMode?: boolean }) {
    const router = useRouter();
    const [internalOpen, setInternalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<FormValues>(() => livreur ? { nom: livreur.nom, telephone: livreur.telephone || "", cin: livreur.cin || "", vehicule: livreur.vehicule || "", active: livreur.active } : emptyForm);
    const isEdit = !!livreur && !deleteMode;
    const dialogOpen = open ?? internalOpen;
    const changeOpen = (value: boolean) => { setInternalOpen(value); onOpenChange?.(value); };

    const submit = async (event: React.FormEvent) => {
        event.preventDefault(); setLoading(true);
        const result = isEdit && livreur ? await updateLivreurAction(livreur.id, form) : await createLivreurAction(form);
        setLoading(false);
        if (!result.success) return toast.error(result.error || "Une erreur est survenue");
        toast.success(isEdit ? "Livreur mis à jour" : "Livreur créé"); changeOpen(false); router.refresh();
    };
    const remove = async () => {
        if (!livreur) return; setLoading(true); const result = await deleteLivreurAction(livreur.id); setLoading(false);
        if (!result.success) return toast.error(result.error || "Une erreur est survenue");
        toast.success("Livreur supprimé"); changeOpen(false); router.refresh();
    };
    const set = (key: keyof FormValues, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

    return <Dialog open={dialogOpen} onOpenChange={changeOpen}>
        {!livreur && <DialogTrigger asChild><Button className="bg-[#C17A2B] hover:bg-[#A0621F]"><Plus className="mr-2 h-4 w-4" />Nouveau livreur</Button></DialogTrigger>}
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader><DialogTitle>{deleteMode ? "Supprimer le livreur" : isEdit ? "Modifier le livreur" : "Nouveau livreur"}</DialogTitle><DialogDescription>{deleteMode ? `Supprimer définitivement ${livreur?.nom} ?` : "Renseignez les informations du livreur."}</DialogDescription></DialogHeader>
            {deleteMode ? <DialogFooter><Button variant="outline" onClick={() => changeOpen(false)} disabled={loading}>Annuler</Button><Button variant="destructive" onClick={remove} disabled={loading}>Supprimer</Button></DialogFooter> :
                <form className="space-y-4" onSubmit={submit}>
                    <div className="space-y-2"><Label htmlFor="nom">Nom *</Label><Input id="nom" value={form.nom} onChange={(e) => set("nom", e.target.value)} required minLength={2} /></div>
                    <div className="space-y-2"><Label htmlFor="telephone">Téléphone</Label><Input id="telephone" value={form.telephone} onChange={(e) => set("telephone", e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="cin">CIN</Label><Input id="cin" value={form.cin} onChange={(e) => set("cin", e.target.value)} /></div>
                    <div className="space-y-2"><Label htmlFor="vehicule">Véhicule / immatriculation</Label><Input id="vehicule" value={form.vehicule} onChange={(e) => set("vehicule", e.target.value)} /></div>
                    <div className="flex items-center gap-3"><Checkbox id="active" checked={form.active} onCheckedChange={(value) => set("active", value === true)} /><Label htmlFor="active">Livreur actif</Label></div>
                    <DialogFooter><Button type="button" variant="outline" onClick={() => changeOpen(false)} disabled={loading}>Annuler</Button><Button type="submit" disabled={loading}>{isEdit ? "Mettre à jour" : "Créer"}</Button></DialogFooter>
                </form>}
        </DialogContent>
    </Dialog>;
}
