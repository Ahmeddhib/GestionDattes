"use client";

import { useState, useTransition } from "react";
import { AtSign, BadgeCheck, Building2, CalendarDays, KeyRound, Save, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { updateProfileAction } from "@/actions/profile/update-profile.action";
import { Avatar } from "@/components/shared/Avatar";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/ui/input";
import { useClientTranslations } from "@/hooks/useClientTranslations";

interface ProfileUser {
    name: string;
    email: string;
    active: boolean;
    createdAt: string;
    image?: string | null;
    provider: "credentials" | "google";
    role: string;
    tenantName?: string;
    tenantCode?: string;
}

export function ProfilePageContent({ user }: { user: ProfileUser }) {
    const { t, locale } = useClientTranslations();
    const [name, setName] = useState(user.name);
    const [isPending, startTransition] = useTransition();

    const save = (event: React.FormEvent) => {
        event.preventDefault();
        startTransition(async () => {
            const result = await updateProfileAction({ name });
            if (result.error) {
                toast.error(result.error);
                return;
            }
            toast.success(t("profile.updated"));
        });
    };

    return (
        <div className="erp-page dashboard-premium min-h-full p-4 sm:p-6 lg:p-8">
            <section className="page-heading mb-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative">
                    <Avatar name={user.name} image={user.image} size="lg" className="h-20 w-20 rounded-2xl text-2xl ring-4 ring-white/70 dark:ring-[#5b4027]/40" />
                    <span className="absolute -bottom-1 -end-1 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-emerald-500 text-white dark:border-[#17120d]">
                        <BadgeCheck className="h-4 w-4" />
                    </span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#a76824] dark:text-[#e6a73c]">KAYEN · Fruits Packaging</p>
                    <h1 className="page-title truncate text-2xl font-bold sm:text-3xl">{t("profile.title")}</h1>
                    <p className="mt-1 text-sm text-[#806e59] dark:text-[#aa9983]">{t("profile.subtitle")}</p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {user.active ? t("profile.active") : t("profile.inactive")}
                </span>
            </section>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,.65fr)]">
                <form onSubmit={save} className="dashboard-card rounded-2xl border p-5 sm:p-6">
                    <div className="mb-6 flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fff1d9] text-[#b36b1d] dark:bg-[#352313] dark:text-[#f0b654]"><UserRound className="h-5 w-5" /></span>
                        <div><h2 className="font-semibold">{t("profile.personalInfo")}</h2><p className="text-xs text-muted-foreground">{t("profile.personalHint")}</p></div>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium">
                            <span>{t("profile.fullName")}</span>
                            <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} autoComplete="name" />
                        </label>
                        <label className="space-y-2 text-sm font-medium">
                            <span>{t("auth.email")}</span>
                            <div className="relative"><AtSign className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={user.email} readOnly className="ps-9 opacity-75" /></div>
                            <span className="block text-[11px] font-normal text-muted-foreground">{t("profile.emailLocked")}</span>
                        </label>
                    </div>
                    <div className="mt-6 flex justify-end border-t border-border pt-5">
                        <Button type="submit" disabled={isPending || name.trim() === user.name}>
                            <Save className="h-4 w-4" />{isPending ? t("profile.saving") : t("profile.save")}
                        </Button>
                    </div>
                </form>

                <aside className="dashboard-card rounded-2xl border p-5 sm:p-6">
                    <h2 className="mb-5 font-semibold">{t("profile.account")}</h2>
                    <dl className="space-y-4 text-sm">
                        {[
                            { icon: Building2, label: t("profile.wakala"), value: user.tenantName ? `${user.tenantName}${user.tenantCode ? ` · ${user.tenantCode}` : ""}` : "—" },
                            { icon: ShieldCheck, label: t("profile.role"), value: user.role },
                            { icon: KeyRound, label: t("profile.signInMethod"), value: user.provider === "google" ? "Google" : t("profile.password") },
                            { icon: CalendarDays, label: t("profile.memberSince"), value: new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(user.createdAt)) },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                                <Icon className="h-4 w-4 shrink-0 text-[#c17a2b]" />
                                <div className="min-w-0"><dt className="text-[11px] text-muted-foreground">{label}</dt><dd className="truncate font-medium">{value}</dd></div>
                            </div>
                        ))}
                    </dl>
                </aside>
            </div>
        </div>
    );
}
