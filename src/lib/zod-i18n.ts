import { z } from "zod";

export type Locale = "fr" | "ar" | "en";

export const zodMessages = {
    fr: {
        required: "Ce champ est requis",
        invalid_email: "Email invalide",
        min_string: (min: number) => `Doit contenir au moins ${min} caractère${min > 1 ? "s" : ""}`,
        max_string: (max: number) => `Ne peut pas dépasser ${max} caractère${max > 1 ? "s" : ""}`,
        min_number: (min: number) => `Doit être au moins ${min}`,
        positive: "Doit être un nombre positif",
        integer: "Doit être un nombre entier",
        regex: "Format invalide",
        // Specific messages
        name_required: "Le nom est requis",
        email_required: "L'email est requis",
        password_required: "Le mot de passe est requis",
        password_min: "Le mot de passe doit contenir au moins 8 caractères",
        role_required: "Le rôle est requis",
        region_required: "La région est requise",
        cin_exact: "Le CIN doit contenir exactement 8 caractères",
        code_min: "Le code doit contenir au moins 3 caractères",
        role_format: "Le nom doit être en majuscules avec underscores uniquement (ex: SUPER_ADMIN)",
    },
    ar: {
        required: "هذا الحقل مطلوب",
        invalid_email: "البريد الإلكتروني غير صالح",
        min_string: (min: number) => `يجب أن يحتوي على ${min} حرف على الأقل`,
        max_string: (max: number) => `لا يمكن أن يتجاوز ${max} حرف`,
        min_number: (min: number) => `يجب أن يكون على الأقل ${min}`,
        positive: "يجب أن يكون رقمًا موجبًا",
        integer: "يجب أن يكون رقمًا صحيحًا",
        regex: "صيغة غير صالحة",
        // Specific messages
        name_required: "الاسم مطلوب",
        email_required: "البريد الإلكتروني مطلوب",
        password_required: "كلمة المرور مطلوبة",
        password_min: "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل",
        role_required: "الدور مطلوب",
        region_required: "المنطقة مطلوبة",
        cin_exact: "يجب أن يحتوي رقم التعريف على 8 أحرف بالضبط",
        code_min: "يجب أن يحتوي الرمز على 3 أحرف على الأقل",
        role_format: "يجب أن يكون الاسم بأحرف كبيرة مع شرطات سفلية فقط (مثال: SUPER_ADMIN)",
    },
    en: {
        required: "This field is required",
        invalid_email: "Invalid email",
        min_string: (min: number) => `Must contain at least ${min} character${min > 1 ? "s" : ""}`,
        max_string: (max: number) => `Cannot exceed ${max} character${max > 1 ? "s" : ""}`,
        min_number: (min: number) => `Must be at least ${min}`,
        positive: "Must be a positive number",
        integer: "Must be an integer",
        regex: "Invalid format",
        // Specific messages
        name_required: "Name is required",
        email_required: "Email is required",
        password_required: "Password is required",
        password_min: "Password must contain at least 8 characters",
        role_required: "Role is required",
        region_required: "Region is required",
        cin_exact: "ID number must contain exactly 8 characters",
        code_min: "Code must contain at least 3 characters",
        role_format: "Name must be uppercase with underscores only (e.g., SUPER_ADMIN)",
    },
};

export function getZodErrorMap(locale: Locale = "fr") {
    const messages = zodMessages[locale];

    // Zod v4 compatible error map - using any to avoid type issues
    const errorMap: any = (issue: any, _ctx: any) => {
        switch (issue.code) {
            case z.ZodIssueCode.invalid_type:
                if (issue.received === "undefined" || issue.received === "null") {
                    return { message: messages.required };
                }
                break;
            case z.ZodIssueCode.invalid_format:
                // In Zod v4, email validation uses invalid_format
                if (issue.validation === "email" || issue.expected === "email") {
                    return { message: messages.invalid_email };
                }
                return { message: messages.regex };
            case z.ZodIssueCode.too_small:
                if (issue.type === "string") {
                    return { message: messages.min_string(issue.minimum as number) };
                }
                if (issue.type === "number") {
                    return { message: messages.min_number(issue.minimum as number) };
                }
                break;
            case z.ZodIssueCode.too_big:
                if (issue.type === "string") {
                    return { message: messages.max_string(issue.maximum as number) };
                }
                break;
        }

        return { message: _ctx.defaultError };
    };

    return errorMap as z.ZodErrorMap;
}

// Helper pour définir l'error map globalement
export function setZodLocale(locale: Locale) {
    z.setErrorMap(getZodErrorMap(locale));
}
