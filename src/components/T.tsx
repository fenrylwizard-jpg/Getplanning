"use client";

import React from "react";
import { useTranslation } from "@/lib/LanguageContext";

export default function T({ k, dataText }: { k?: string, dataText?: string }) {
    const { t, tData } = useTranslation();

    if (dataText !== undefined) {
        return <>{tData(dataText)}</>;
    }

    if (k !== undefined) {
        return <>{t(k)}</>;
    }

    return null;
}
