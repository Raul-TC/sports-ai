import { useState } from "react";
import { ExcludedTeam } from "@/types";

export function useExcludedTeams() {
    const [excludedTeams, setExcludedTeams] = useState<ExcludedTeam[]>([{
        name: "CF Montréal",
        losses: 2,
        goalsScored: 0,
        lastUpdate: new Date().toISOString(),
    }]);

    const updateExcludedTeam = (teamName: string, scoredGoals: number, isWin: boolean) => {
        setExcludedTeams(prev => {
            const existing = prev.find(t => t.name === teamName);
            if (existing) {
                return prev.map(t => {
                    if (t.name === teamName) {
                        return {
                            ...t,
                            losses: isWin ? 0 : t.losses + 1,
                            goalsScored: t.goalsScored + scoredGoals,
                            lastUpdate: new Date().toISOString(),
                        };
                    }
                    return t;
                });
            } else {
                return [
                    ...prev,
                    {
                        name: teamName,
                        losses: isWin ? 0 : 1,
                        goalsScored: scoredGoals,
                        lastUpdate: new Date().toISOString(),
                    },
                ];
            }
        });
    };

    const removeExcludedTeam = (teamName: string) => {
        setExcludedTeams(prev => prev.filter(t => t.name !== teamName));
    };

    return { excludedTeams, updateExcludedTeam, removeExcludedTeam };
}