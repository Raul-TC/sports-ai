import { useState, useMemo } from "react";
import { PredictionResult } from "@/types";

export function useMatchFilters(predictions: PredictionResult[]) {
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

    const filteredPredictions = useMemo(() => {
        return predictions
            .filter((p) => {
                const matchDate = getDateWithoutTime(p.startTime);
                if (activeTab === "today") return isSameDay(matchDate, today);
                if (activeTab === "future") return matchDate > today;
                return matchDate < today;
            })
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [predictions, activeTab, today]);

    const todayCount = predictions.filter((p) => isSameDay(getDateWithoutTime(p.startTime), today)).length;
    const futureCount = predictions.filter((p) => getDateWithoutTime(p.startTime) > today).length;
    const pastCount = predictions.filter((p) => getDateWithoutTime(p.startTime) < today).length;

    return {
        activeTab,
        setActiveTab,
        filteredPredictions,
        todayCount,
        futureCount,
        pastCount,
    };
}