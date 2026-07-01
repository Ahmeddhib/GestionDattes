"use client";

import { useClientTranslations } from "./useClientTranslations";
import { useMemo } from "react";

export function useZodTranslation() {
    const { t, locale } = useClientTranslations();

    const errorMessages = useMemo(() => ({
        required: t("validation.required"),
        invalidEmail: t("validation.invalidEmail"),
        minLength: (min: number) => t("validation.minLength").replace("{min}", String(min)),
        maxLength: (max: number) => t("validation.maxLength").replace("{max}", String(max)),
        minValue: (min: number) => t("validation.minValue").replace("{min}", String(min)),
        positive: t("validation.positive"),
        integer: t("validation.integer"),
        invalidFormat: t("validation.invalidFormat"),
        exactLength: (length: number) => t("validation.exactLength").replace("{length}", String(length)),
        uppercaseOnly: t("validation.uppercaseOnly"),
        roleFormat: t("validation.roleFormat"),
        passwordMin: t("validation.passwordMin"),
        cinExact: t("validation.cinExact"),
    }), [t]);

    return { errorMessages, locale, t };
}
