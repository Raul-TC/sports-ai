// utils/pickValidation.ts
import { ScoreResult } from "./scoringEngine";

export function isPickCorrect(pick: ScoreResult, results: any): boolean {
    const { home, away, result } = results;
    if (!result) return false;

    const totalGoals = result.homeScore + result.awayScore;
    const totalCorners = result.homeCorners + result.awayCorners;
    const btts = result.homeScore > 0 && result.awayScore > 0;

    switch (pick.market) {
        case 'Resultado':
            if (pick.selection === 'Empate') {
                return result.homeScore === result.awayScore;
            }
            // Si la selección es el nombre de un equipo, comparamos con el ganador real
            const homeWon = result.homeScore > result.awayScore;
            const awayWon = result.awayScore > result.homeScore;
            if (homeWon && pick.selection === home.teamName) return true;
            if (awayWon && pick.selection === away.teamName) return true;
            return false;

        case 'Total de goles':
            if (pick.selection.includes('Over')) {
                const line = parseFloat(pick.selection.split(' ')[1]);
                return totalGoals > line;
            } else if (pick.selection.includes('Under')) {
                const line = parseFloat(pick.selection.split(' ')[1]);
                return totalGoals < line;
            }
            return false;

        case 'Ambos anotan':
            return pick.selection === 'Sí' ? btts : !btts;

        case 'Córners':
            if (pick.selection.includes('Over')) {
                const line = parseFloat(pick.selection.split(' ')[1]);
                return totalCorners > line;
            } else if (pick.selection.includes('Under')) {
                const line = parseFloat(pick.selection.split(' ')[1]);
                return totalCorners < line;
            }
            return false;

        default:
            return false;
    }
}