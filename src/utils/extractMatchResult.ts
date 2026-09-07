// utils/extractMatchResult.ts
// export interface MatchResult {
//     homeScore: number;
//     awayScore: number;
//     homeXG: number;
//     homeXGA: number;
//     awayXG: number;
//     awayXGA: number;
//     homeShots: number;
//     awayShots: number;
//     homeShotsOnTarget: number;
//     awayShotsOnTarget: number;
//     homeCorners: number;
//     awayCorners: number;
//     winner: 'home' | 'away' | 'draw';
//     status: 'final' | 'live' | 'scheduled';
// }

// export function extractMatchResult(statsData: any): MatchResult | null {
//     if (!statsData?.games?.length) return null;

//     const game = statsData.games[0];
//     const home = game.homeCompetitor;
//     const away = game.awayCompetitor;

//     // Extraer estadísticas específicas por nombre
//     const getStat = (competitorId: number, statName: string): number => {
//         const stat = statsData.statistics?.find(
//             (s: any) => s.competitorId === competitorId && s.name === statName
//         );
//         return stat ? parseFloat(stat.value) || 0 : 0;
//     };

//     const homeId = home.id;
//     const awayId = away.id;

//     return {
//         homeScore: home.score || 0,
//         awayScore: away.score || 0,
//         homeXG: getStat(homeId, 'Goles esperados'),
//         homeXGA: getStat(homeId, 'Goles esperados recibidos'),
//         awayXG: getStat(awayId, 'Goles esperados'),
//         awayXGA: getStat(awayId, 'Goles esperados recibidos'),
//         homeShots: getStat(homeId, 'Total Remates'),
//         awayShots: getStat(awayId, 'Total Remates'),
//         homeShotsOnTarget: getStat(homeId, 'Remates a Puerta'),
//         awayShotsOnTarget: getStat(awayId, 'Remates a Puerta'),
//         homeCorners: getStat(homeId, 'Saques de Esquina'),
//         awayCorners: getStat(awayId, 'Saques de Esquina'),
//         winner: home.score > away.score ? 'home' : away.score > home.score ? 'away' : 'draw',
//         status: game.statusText === 'Finalizado' ? 'final' : 'live',
//     };
// }

export interface MatchResult {
    homeScore: number;
    awayScore: number;
    homeXG: number;
    homeXGA: number;
    awayXG: number;
    awayXGA: number;
    homeShots: number;
    awayShots: number;
    homeOffsides: number;
    awayOffsides: number;
    homeYellowCards: number;
    awayYellowCards: number;
    homeRedCards: number;
    awayRedCards: number;
    homeFauls: number;
    homeFaulsReceived: number;
    awayFaulsReceived: number;
    awayFauls: number;
    homeGoalkeeperSaves: number;
    awayGoalkeeperSaves: number;
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
        homeXGA: getStat(homeId, 'Goles esperados recibidos'),
        awayXG: getStat(awayId, 'Goles esperados'),
        awayXGA: getStat(awayId, 'Goles esperados recibidos'),
        homeShots: getStat(homeId, 'Total Remates'),
        awayShots: getStat(awayId, 'Total Remates'),
        homeOffsides: getStat(homeId, 'Fueras de Juego'),
        awayOffsides: getStat(awayId, 'Fueras de Juego'),
        homeYellowCards: getStat(homeId, 'Tarjetas Amarillas'),
        awayYellowCards: getStat(awayId, 'Tarjetas Amarillas'),
        homeRedCards: getStat(homeId, 'Tarjetas Rojas'),
        awayRedCards: getStat(awayId, 'Tarjetas Rojas'),
        homeFauls: getStat(homeId, 'Faltas'),
        awayFauls: getStat(awayId, 'Faltas'),
        homeFaulsReceived: getStat(homeId, 'Faltas recibidas'),
        awayFaulsReceived: getStat(awayId, 'Faltas recibidas'),
        homeShotsOnTarget: getStat(homeId, 'Remates a Puerta'),
        awayShotsOnTarget: getStat(awayId, 'Remates a Puerta'),
        homeCorners: getStat(homeId, 'Saques de Esquina'),
        awayCorners: getStat(awayId, 'Saques de Esquina'),
        homeGoalkeeperSaves: getStat(homeId, 'Salvadas de Portero'),
        awayGoalkeeperSaves: getStat(awayId, 'Atajadas de Portero'),
        winner: home.score > away.score ? 'home' : away.score > home.score ? 'away' : 'draw',
        status: game.statusText === 'Finalizado' ? 'final' : 'live',
    };
}