// utils/pickValidation.ts
export function isPickCorrect(pick: any, result: any, homeTeam: string, awayTeam: string): boolean {
    if (!result) return false;

    const homeGoals = result.homeScore ?? 0;
    const awayGoals = result.awayScore ?? 0;
    const homeCorners = result.homeCorners ?? 0;
    const awayCorners = result.awayCorners ?? 0;
    const totalGoals = homeGoals + awayGoals;
    const totalCorners = homeCorners + awayCorners;
    const btts = homeGoals > 0 && awayGoals > 0;
    const homeWon = homeGoals > awayGoals;
    const awayWon = awayGoals > homeGoals;
    const isDraw = homeGoals === awayGoals;

    const market = pick.market;
    const selection = pick.selection;

    // Resultado
    if (market === 'Resultado') {
        if (selection === 'Empate') return isDraw;
        if (selection === homeTeam) return homeWon;
        if (selection === awayTeam) return awayWon;
        return false;
    }

    // Total de goles (con cualquier línea)
    if (market.startsWith('Total de goles')) {
        const lineMatch = selection.match(/(\d+\.?\d*)/);
        if (!lineMatch) return false;
        const line = parseFloat(lineMatch[0]);
        if (selection.includes('Over')) return totalGoals > line;
        if (selection.includes('Under')) return totalGoals < line;
        return false;
    }

    // BTTS
    if (market === 'BTTS') {
        if (selection === 'Sí') return btts;
        if (selection === 'No') return !btts;
        return false;
    }

    // Córners
    if (market === 'Córners') {
        const lineMatch = selection.match(/(\d+\.?\d*)/);
        if (!lineMatch) return false;
        const line = parseFloat(lineMatch[0]);
        if (selection.includes('Over')) return totalCorners > line;
        if (selection.includes('Under')) return totalCorners < line;
        return false;
    }

    // Doble oportunidad (1X, X2, 12)
    if (market === 'Doble oportunidad') {
        if (selection === 'Local o Empate (1X)') return homeWon || isDraw;
        if (selection === 'Empate o Visitante (X2)') return awayWon || isDraw;
        if (selection === 'Local o Visitante (12)') return homeWon || awayWon;
        return false;
    }

    // Draw No Bet
    if (market === 'Draw No Bet') {
        if (selection === homeTeam) return homeWon;
        if (selection === awayTeam) return awayWon;
        return false;
    }

    // Goles del equipo (local o visitante)
    if (market.startsWith('Goles del local') || market.startsWith('Goles del visitante')) {
        const isHome = market.includes('local');
        const teamGoals = isHome ? homeGoals : awayGoals;
        const lineMatch = selection.match(/(\d+\.?\d*)/);
        if (!lineMatch) return false;
        const line = parseFloat(lineMatch[0]);
        if (selection.includes('Over')) return teamGoals > line;
        if (selection.includes('Under')) return teamGoals < line;
        return false;
    }

    // Win to Nil
    if (market === 'Win to Nil') {
        if (selection === homeTeam) return homeWon && awayGoals === 0;
        if (selection === awayTeam) return awayWon && homeGoals === 0;
        return false;
    }

    // Clean Sheet
    if (market === 'Clean Sheet') {
        if (selection === homeTeam) return awayGoals === 0;
        if (selection === awayTeam) return homeGoals === 0;
        return false;
    }

    return false;
}