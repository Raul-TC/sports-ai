import { useState, useMemo } from "react";
import { PredictionResult } from "@/types";
import { enrichPredictions } from "@/utils/enrichPredictions";

export function useMatchFilters(predictions: PredictionResult[], results: any[]) {
    const [activeTab, setActiveTab] = useState<"today" | "future" | "past">("today");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isSameDay = (date1: Date, date2: Date) => {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    };

    const getDateWithoutTime = (iso: string) => {
        const d = new Date(iso);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const enrichedPredictions = useMemo(() => {
        return enrichPredictions(predictions, results);
    }, [predictions, results]);

    const now = new Date().getTime();
    const twoHoursMs = 2 * 60 * 60 * 1000;

    const filteredPredictions = useMemo(() => {
        return enrichedPredictions
            .filter((p) => {
                const matchDate = getDateWithoutTime(p.startTime);
                const startTimeMs = new Date(p.startTime).getTime();

                if (activeTab === "today") {
                    // Es hoy y aún no han pasado 2 horas desde el inicio
                    return isSameDay(matchDate, today) && (now - startTimeMs < twoHoursMs);
                }
                if (activeTab === "future") {
                    // Fecha futura (cualquier día posterior a hoy)
                    return matchDate > today;
                }
                // Pasados: si es anterior a hoy, o es hoy pero ya pasaron 2 horas
                if (matchDate < today) return true;
                if (isSameDay(matchDate, today) && (now - startTimeMs >= twoHoursMs)) return true;
                return false;
            })
            .sort((a, b) => activeTab === 'today' ? new Date(a.startTime).getTime() - new Date(b.startTime).getTime() : new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 20);
    }, [predictions, activeTab, today]);

    const todayCount = predictions.filter((p) => {
        const matchDate = getDateWithoutTime(p.startTime);
        const startTimeMs = new Date(p.startTime).getTime();
        return isSameDay(matchDate, today) && (now - startTimeMs < twoHoursMs);
    }).length;

    const futureCount = predictions.filter((p) => {
        return getDateWithoutTime(p.startTime) > today;
    }).length;

    const pastCount = predictions.filter((p) => {
        const matchDate = getDateWithoutTime(p.startTime);
        const startTimeMs = new Date(p.startTime).getTime();
        if (matchDate < today) return true;
        if (isSameDay(matchDate, today) && (now - startTimeMs >= twoHoursMs)) return true;
        return false;
    }).length;
    return {
        activeTab,
        setActiveTab,
        filteredPredictions,
        todayCount,
        futureCount,
        pastCount,
    };
}