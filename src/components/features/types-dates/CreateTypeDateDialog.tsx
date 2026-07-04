"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createTypeDateAction } from "@/actions/types-dates/create-type-date.action";
import { useClientTranslations } from "@/hooks/useClientTranslations";

export function CreateTypeDateDialog() {
    const { t } = useClientTranslations();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await createTypeDateAction(formData);

        setLoading(false);

        if (result.success) {
            toast.success(t("messages.success.created").replace("{entity}", t("typesDates.title")));
            setOpen(false);
            (e.target as HTMLFormElement).reset();
        } else {
            toast.error(result.error || t("messages.error.generic"));
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 rounded-[9px] bg-[#C17A2B] hover:bg-[#A0621F]">
                    <Plus className="h-4 w-4" />
                    {t("typesDates.createNew")}
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[14px] sm:max-w-[500px] bg-white">
                <DialogHeader>
                    <DialogTitle className="text-[#3D1C00]">
                        {t("typesDates.createDialog")}
                    </DialogTitle>
                    <DialogDescription className="text-[#3D1C00]/60">
                        {t("typesDates.createDescription")}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="nom" className="text-[#3D1C00]">
                            {t("typesDates.name")}
                        </Label>
                        <Input
                            id="nom"
                            name="nom"
                            placeholder={t("typesDates.namePlaceholder")}
                            required
                            className="rounded-[7px] border-[#C17A2B]/20 focus:border-[#C17A2B] bg-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-[#3D1C00]">
                            {t("typesDates.descriptionLabel")}
                        </Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder={t("typesDates.descriptionPlaceholder")}
                            rows={3}
                            className="rounded-[7px] border-[#C17A2B]/20 focus:border-[#C17A2B] bg-white"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="rounded-[9px]"
                            disabled={loading}
                        >
                            {t("common.cancel")}
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="rounded-[9px] bg-[#C17A2B] hover:bg-[#A0621F]"
                        >
                            {loading ? t("typesDates.creating") : t("common.create")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
