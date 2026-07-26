// utils/extractMatchResult.ts
export interface MatchResult {
    homeScore: number;
    awayScore: number;
    homeXG: number;
    awayXG: number;
    homeShots: number;
    awayShots: number;
    homeShotsOnTarget: number;
    awayShotsOnTarget: number;
    homeCorners: number;
    awayCorners: number;
    winner: 'home' | 'away' | 'draw';
    status: 'final' | 'live' | 'scheduled';
}

export function extractMatchResult(statsData: any): MatchResult | null {
    if (!statsData?.games?.length) return null;

    const game = statsData.games[0];
    const home = game.homeCompetitor;
    const away = game.awayCompetitor;

    // Extraer estadísticas específicas por nombre
    const getStat = (competitorId: number, statName: string): number => {
        const stat = statsData.statistics?.find(
            (s: any) => s.competitorId === competitorId && s.name === statName
        );
        return stat ? parseFloat(stat.value) || 0 : 0;
    };

    const homeId = home.id;
    const awayId = away.id;

    return {
        homeScore: home.score || 0,
        awayScore: away.score || 0,
        homeXG: getStat(homeId, 'Goles esperados'),
        awayXG: getStat(awayId, 'Goles esperados'),
        homeShots: getStat(homeId, 'Total Remates'),
        awayShots: getStat(awayId, 'Total Remates'),
        homeShotsOnTarget: getStat(homeId, 'Remates a Puerta'),
        awayShotsOnTarget: getStat(awayId, 'Remates a Puerta'),
        homeCorners: getStat(homeId, 'Saques de Esquina'),
        awayCorners: getStat(awayId, 'Saques de Esquina'),
        winner: home.score > away.score ? 'home' : away.score > home.score ? 'away' : 'draw',
        status: game.statusText === 'Finalizado' ? 'final' : 'live',
    };
}