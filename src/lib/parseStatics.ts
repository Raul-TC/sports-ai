interface Statistic {
    id: number;
    name: string;
    competitorId: number;
    value: string;
    valuePercentage: number;
    statisticGroup?: number;
    markedTeam?: number;
}

interface CategoryStats {
    statistics: Statistic[];
    games?: {
        homeCompetitor?: { id: number };
        awayCompetitor?: { id: number };
    }[];
}

interface MatchStats {
    todos: CategoryStats;
    ultimos5: CategoryStats;
    ultimos5LocalVisita: CategoryStats;
}

interface MatchData {
    matchUrl: string;
    stats: MatchStats;
}

// Extrae valor numérico de un string como "1.8", "2.25", etc.
function parseNumeric(value: string): number | null {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
}

// Obtiene el valor de una estadística para un competidor en una categoría
function getStatValue(category: CategoryStats, competitorId: number, statId: number): number | null {
    const stat = category.statistics.find(s => s.competitorId === competitorId && s.id === statId);
    // console.log({ stat })
    if (!stat) return null;
    return parseNumeric(stat.value);
}

// Calcula el promedio ponderado de una estadística para un competidor a través de las tres categorías
function weightedAvg(
    categoryTodos: CategoryStats,
    categoryUltimos5: CategoryStats,
    categoryUltimos5LocalVisita: CategoryStats,
    competitorId: number,
    statId: number,
    weights: { todos: number; ultimos5: number; ultimos5LocalVisita: number }
): number | null {
    const valTodos = getStatValue(categoryTodos, competitorId, statId);
    const valUltimos5 = getStatValue(categoryUltimos5, competitorId, statId);
    const valLocalVisita = getStatValue(categoryUltimos5LocalVisita, competitorId, statId);

    if (valTodos === null || valUltimos5 === null || valLocalVisita === null) {
        return null;
    }

    // console.log({ valTodos, })
    return ((weights.todos * valTodos) + (weights.ultimos5 * valUltimos5) + (weights.ultimos5LocalVisita * valLocalVisita));
}

// Calcula el shot_factor (ratio remates/remates al arco ponderado) para un competidor
function computeShotFactor(
    categoryTodos: CategoryStats,
    categoryUltimos5: CategoryStats,
    categoryUltimos5LocalVisita: CategoryStats,
    competitorId: number,
    weights: { todos: number; ultimos5: number; ultimos5LocalVisita: number }
): number {
    // Obtener remates y remates al arco en cada categoría
    const shotsTodos = getStatValue(categoryTodos, competitorId, 165) ?? 0;
    const shotsOTTodos = getStatValue(categoryTodos, competitorId, 168) ?? 0;
    const ratioTodos = shotsOTTodos > 0 ? shotsTodos / shotsOTTodos : 0;

    const shotsUltimos5 = getStatValue(categoryUltimos5, competitorId, 165) ?? 0;
    const shotsOTUltimos5 = getStatValue(categoryUltimos5, competitorId, 168) ?? 0;
    const ratioUltimos5 = shotsOTUltimos5 > 0 ? shotsUltimos5 / shotsOTUltimos5 : 0;

    const shotsLocalVisita = getStatValue(categoryUltimos5LocalVisita, competitorId, 165) ?? 0;
    const shotsOTLocalVisita = getStatValue(categoryUltimos5LocalVisita, competitorId, 168) ?? 0;
    const ratioLocalVisita = shotsOTLocalVisita > 0 ? shotsLocalVisita / shotsOTLocalVisita : 0;

    return weights.todos * ratioTodos + weights.ultimos5 * ratioUltimos5 + weights.ultimos5LocalVisita * ratioLocalVisita;
}

// Desviación estándar
function stdDev(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(variance);
}

// Función principal que procesa un partido
function processMatchData(matchData: MatchData) {


    const { stats } = matchData;
    const { todos, ultimos5, ultimos5LocalVisita } = stats;

    // console.log({ todos })
    // Obtener IDs de local y visitante (de cualquier categoría, son los mismos)
    const game = todos.games?.[0] || ultimos5.games?.[0] || ultimos5LocalVisita.games?.[0];
    if (!game) throw new Error('No game data found');
    const homeId = game.homeCompetitor?.id;
    const awayId = game.awayCompetitor?.id;
    if (homeId === undefined || awayId === undefined) throw new Error('Missing competitor IDs');

    const weights = { todos: 0.2, ultimos5: 0.5, ultimos5LocalVisita: 0.3 };

    // Obtener promedios ponderados para cada estadística
    const home = {
        name: game.homeCompetitor?.name,
        goals: weightedAvg(todos, ultimos5, ultimos5LocalVisita, homeId, 153, weights),
        goalsConceded: weightedAvg(todos, ultimos5, ultimos5LocalVisita, homeId, 156, weights),
        xG: weightedAvg(todos, ultimos5, ultimos5LocalVisita, homeId, 159, weights),
        xGA: weightedAvg(todos, ultimos5, ultimos5LocalVisita, homeId, 162, weights),
        shots: weightedAvg(todos, ultimos5, ultimos5LocalVisita, homeId, 165, weights),
        shotsOnTarget: weightedAvg(todos, ultimos5, ultimos5LocalVisita, homeId, 168, weights),
    };

    console.log({ home })
    const away = {
        name: game.awayCompetitor?.name,
        goals: weightedAvg(todos, ultimos5, ultimos5LocalVisita, awayId, 153, weights),
        goalsConceded: weightedAvg(todos, ultimos5, ultimos5LocalVisita, awayId, 156, weights),
        xG: weightedAvg(todos, ultimos5, ultimos5LocalVisita, awayId, 159, weights),
        xGA: weightedAvg(todos, ultimos5, ultimos5LocalVisita, awayId, 162, weights),
        shots: weightedAvg(todos, ultimos5, ultimos5LocalVisita, awayId, 165, weights),
        shotsOnTarget: weightedAvg(todos, ultimos5, ultimos5LocalVisita, awayId, 168, weights),
    };

    // Verificar que los datos esenciales existan
    if (home.xG === null || away.xG === null || home.goals === null || away.goals === null) {
        throw new Error('Faltan datos esenciales (xG o goles) para el cálculo');
    }

    // Calcular shot_factor para cada equipo según la nueva definición
    const shotFactorLocal = computeShotFactor(todos, ultimos5, ultimos5LocalVisita, homeId, weights);
    const shotFactorAway = computeShotFactor(todos, ultimos5, ultimos5LocalVisita, awayId, weights);

    // Calcular xG ajustado para el partido (xG_match)
    const xG_local_match = home.xG * (0.8 + shotFactorLocal);
    const xG_away_match = away.xG * (0.8 + shotFactorAway);
    const xg_total = xG_local_match + xG_away_match;

    // Otras métricas
    const xG_local = home.xG;
    const xGA_local = home.xGA ?? 0;
    const xG_away = away.xG;
    const xGA_away = away.xGA ?? 0;
    const golesEsperados = xG_local + xG_away; // suma de xG no ajustados

    // Eficiencia ofensiva = goles / xG (no ajustado)
    const eficienciaLocal = xG_local > 0 ? home.goals / xG_local : 0;
    const eficienciaAway = xG_away > 0 ? away.goals / xG_away : 0;

    // Volatilidad: desviación estándar del total de xG (no ajustado) en cada categoría
    const getTotalXG = (cat: CategoryStats) => {
        const h = getStatValue(cat, homeId, 159);
        const a = getStatValue(cat, awayId, 159);
        return (h !== null && a !== null) ? h + a : null;
    };
    const totalXGs = [getTotalXG(todos), getTotalXG(ultimos5), getTotalXG(ultimos5LocalVisita)]
        .filter(v => v !== null) as number[];
    const volatilidad = totalXGs.length > 1 ? stdDev(totalXGs) : 0;

    // Precision drop: diferencia de eficiencia entre "todos" y "ultimos5LocalVisita"
    const getEfficiencyForCategory = (cat: CategoryStats, competitorId: number) => {
        const g = getStatValue(cat, competitorId, 153);
        const x = getStatValue(cat, competitorId, 159);
        return (g !== null && x !== null && x > 0) ? g / x : null;
    };
    const effTodosHome = getEfficiencyForCategory(todos, homeId);
    const effLocalVisitaHome = getEfficiencyForCategory(ultimos5LocalVisita, homeId);
    const precision_drop_local = (effTodosHome !== null && effLocalVisitaHome !== null)
        ? effTodosHome - effLocalVisitaHome
        : 0;

    const effTodosAway = getEfficiencyForCategory(todos, awayId);
    const effLocalVisitaAway = getEfficiencyForCategory(ultimos5LocalVisita, awayId);
    const precision_drop_away = (effTodosAway !== null && effLocalVisitaAway !== null)
        ? effTodosAway - effLocalVisitaAway
        : 0;

    // const buildTeamStat = (teamId: number, teamName: string): ExternalTeamStat => ({
    //     teamId,
    //     teamName,
    //     // goalsFor: ,
    //     // goalsAgainst: getStatValue(statistics, statIds.goalsAgainst, teamId, statisticGroup),
    //     // xGFor: ,
    //     xGAgainst: getStatValue(statistics, statIds.xGAgainst, teamId, statisticGroup),
    //     cornersAvg: getStatValue(statistics, statIds.corners, teamId, statisticGroup),
    // });
    // Construir el objeto de resultados
    return {
        matchUrl: matchData.matchUrl,
        competitionName: "",
        starTime: "",
        competitionName: game.competitionDisplayName,
        startTime: game.startTime,
        home: {
            localTeam: home.name,
            xGLocal: xG_local,
            XGALocal: xGA_local,
            GolesEsperadosLocal: xG_local,
            shot_factor_local: shotFactorLocal,
            xG_local_match,
            EficienciaOfensivaLocal: eficienciaLocal,
            precision_drop_local,
            EficienciaLocal: eficienciaLocal,
        },
        away: {
            awayTeam: game.awayCompetitor?.name,
            XGTotalesVisita: xG_away,
            XGATotalVisita: xGA_away,
            GolesEsperadosVisita: xG_away,
            shot_factor_away: shotFactorAway,
            xG_away_match,
            EficienciaOfensivaAway: eficienciaAway,
            precision_drop_away,
            EficienciaVisita: eficienciaAway,
        },
        GolesEsperados: golesEsperados,
        xg_total,
        Volatilidad: volatilidad,
    };
}

// Procesar todos los partidos
export function computeAllMatches(matchesData: MatchData[]): any[] {
    return matchesData.map(match => processMatchData(match));
}

// Ejemplo de uso (asumiendo que 'data' es el array JSON parseado)
// const results = computeAllMatches(data);
// console.log(JSON.stringify(results, null, 2));