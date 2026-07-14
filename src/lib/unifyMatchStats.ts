// import {
//     RawMatchData,
//     RawStatsBlock,
//     StatIdMap,
//     DEFAULT_STAT_IDS,
//     StatsFilterKey,
// } from "@/lib/parseExternalStats";
import { DEFAULT_STAT_IDS, RawMatchData, RawStatEntry, RawStatsBlock, StatIdMap, StatsFilterKey } from "@/types/externalStats";
import { MatchMetrics, TeamMetrics, UnifiedMatch } from "@/types/unifiedStats";

export interface BlockWeights {
    todos: number;
    ultimos5: number;
    ultimos5LocalVisita: number;
}

export const DEFAULT_WEIGHTS: BlockWeights = {
    todos: 0.1,
    ultimos5: 0.6,
    ultimos5LocalVisita: 0.3,
};

interface TeamBlockStats {
    goalsFor: number;
    goalsAgainst: number;
    xGFor: number;
    xGAgainst: number;
    shots: number;
    shotsOnTarget: number;
    corners: number
}

function extractStatValue(
    statistics: RawStatEntry[],
    statId: number,
    competitorId: number,
    statisticGroup: number | null
): number {
    const entry = statistics.find(
        (s) =>
            s.id === statId &&
            s.competitorId === competitorId &&
            (statisticGroup === null || s.statisticGroup === statisticGroup)
    );
    return entry ? parseFloat(entry.value) || 0 : 0;
}

/** Extrae las 6 métricas base de un equipo dentro de UN bloque (todos/ultimos5/ultimos5LocalVisita) */
function getTeamBlockStats(
    block: RawStatsBlock,
    teamId: number,
    statIds: StatIdMap,
    statisticGroup: number | null
): TeamBlockStats {
    return {
        goalsFor: extractStatValue(block.statistics, statIds.goalsFor, teamId, statisticGroup),
        goalsAgainst: extractStatValue(block.statistics, statIds.goalsAgainst, teamId, statisticGroup),
        xGFor: extractStatValue(block.statistics, statIds.xGFor, teamId, statisticGroup),
        xGAgainst: extractStatValue(block.statistics, statIds.xGAgainst, teamId, statisticGroup),
        shots: extractStatValue(block.statistics, statIds.shots, teamId, statisticGroup),
        shotsOnTarget: extractStatValue(block.statistics, statIds.shotsOnTarget, teamId, statisticGroup),
        corners: extractStatValue(block.statistics, statIds.corners, teamId, statisticGroup)
    };
}


function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}

function normalize(
    value: number,
    min: number,
    max: number
) {
    return clamp((value - min) / (max - min), 0, 1);
}


/** Blend ponderado 20/50/30 (o los pesos que pases) de un valor entre los 3 bloques */
function weightedBlend(
    valueTodos: number,
    valueUltimos5: number,
    valueUltimos5LV: number,
    weights: BlockWeights
): number {
    return (
        valueTodos * weights.todos +
        valueUltimos5 * weights.ultimos5 +
        valueUltimos5LV * weights.ultimos5LocalVisita
    );
}

/** División segura — evita NaN/Infinity cuando el denominador es 0 */
function safeDiv(numerator: number, denominator: number): number {
    return denominator > 0 ? numerator / denominator : 0;
}

/** Desviación estándar poblacional de un arreglo de 3 valores */
function stdDev3(values: [number, number, number]): number {
    const mean = (values[0] + values[1] + values[2]) / 3;
    const variance =
        values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
}

export interface UnifyOptions {
    weights?: BlockWeights;
    statIds?: StatIdMap;
    /** statisticGroup a usar dentro de cada bloque. Default: 2 ("Estadísticas promedio") */
    statisticGroup?: number | null;
}

/**
 * Unifica los 3 bloques de estadísticas (todos/ultimos5/ultimos5LocalVisita)
 * de cada partido en un solo objeto de métricas ponderadas, siguiendo las
 * fórmulas especificadas. Requiere que el JSON de cada partido tenga los
 * 3 bloques presentes — si falta alguno, el partido se omite con un warning.
 */
export function unifyMatchStats(
    raw: RawMatchData[],
    options: UnifyOptions = {}
): UnifiedMatch[] {
    const weights = options.weights ?? DEFAULT_WEIGHTS;
    const statIds = options.statIds ?? DEFAULT_STAT_IDS;
    const statisticGroup = options.statisticGroup === undefined ? 2 : options.statisticGroup;

    console.log({ raw })
    return raw
        .map((match): UnifiedMatch | null => {
            const requiredKeys: StatsFilterKey[] = ["todos", "ultimos5", "ultimos5LocalVisita"];
            const missing = requiredKeys.filter((key) => !match.stats[key]?.games?.length);

            if (missing.length > 0) {
                console.warn(
                    `⚠️ ${match.matchUrl} — faltan bloques [${missing.join(", ")}]. Se omite este partido.`
                );
                return null;
            }

            const todosBlock = match.stats.todos!;
            const ultimos5Block = match.stats.ultimos5!;
            const u5lvBlock = match.stats.ultimos5LocalVisita!;

            const game = ultimos5Block.games[0];
            const homeId = game.homeCompetitor.id;
            const awayId = game.awayCompetitor.id;

            // Extraer stats crudas de cada bloque, para ambos equipos
            const homeTodos = getTeamBlockStats(todosBlock, homeId, statIds, statisticGroup);
            const homeU5 = getTeamBlockStats(ultimos5Block, homeId, statIds, statisticGroup);
            const homeU5LV = getTeamBlockStats(u5lvBlock, homeId, statIds, statisticGroup);
            const awayTodos = getTeamBlockStats(todosBlock, awayId, statIds, statisticGroup);
            const awayU5 = getTeamBlockStats(ultimos5Block, awayId, statIds, statisticGroup);
            const awayU5LV = getTeamBlockStats(u5lvBlock, awayId, statIds, statisticGroup);

            // ---- xG / xGA blend ponderado ----
            const xGTotalLocal = weightedBlend(homeTodos.xGFor, homeU5.xGFor, homeU5LV.xGFor, weights);
            const xGATotalLocal = weightedBlend(homeTodos.xGAgainst, homeU5.xGAgainst, homeU5LV.xGAgainst, weights);
            const xGTotalesVisita = weightedBlend(awayTodos.xGFor, awayU5.xGFor, awayU5LV.xGFor, weights);
            const xGATotalVisita = weightedBlend(awayTodos.xGAgainst, awayU5.xGAgainst, awayU5LV.xGAgainst, weights);
            // console.log({ xGATotalVisita, xGTotalesVisita })

            const golesRecibidosLocal = weightedBlend(homeTodos.goalsAgainst, homeU5.goalsAgainst, homeU5LV.goalsAgainst, weights)
            const golesRecibidosVisita = weightedBlend(awayTodos.goalsAgainst, awayU5.goalsAgainst, awayU5LV.goalsAgainst, weights)
            // ---- Goles esperados (histórico de goles reales, blend ponderado) ----
            // const golesEsperadosLocal = weightedBlend(homeTodos.goalsFor, homeU5.goalsFor, homeU5LV.goalsFor, weights);
            // const golesEsperadosVisita = weightedBlend(awayTodos.goalsFor, awayU5.goalsFor, awayU5LV.goalsFor, weights);
            // const golesEsperadosLocal = (xGTotalLocal + xGATotalVisita) / 2
            // const golesEsperadosVisita = (xGTotalesVisita + xGATotalLocal) / 2
            // const golesEsperadoss = golesEsperadosLocal + golesEsperadosVisita

            // ---- Goles esperados del partido (modelo cruzado clásico de Poisson) ----
            // const homeLambdaClassicNormal = (xGTotalLocal + xGATotalVisita) / 2;
            // const awayLambdaClassic = (xGTotalesVisita + xGATotalLocal) / 2;
            // const golesEsperados = homeLambdaClassic + awayLambdaClassic;


            // ---- shot_factor: blend ponderado de (remates / remates al arco) ----
            const shotFactorLocal =
                weights.todos * safeDiv(homeTodos.shotsOnTarget, homeTodos.shots) +
                weights.ultimos5 * safeDiv(homeU5.shotsOnTarget, homeU5.shots) +
                weights.ultimos5LocalVisita * safeDiv(homeU5LV.shotsOnTarget, homeU5LV.shots);

            const shotFactorAway =
                weights.todos * safeDiv(awayTodos.shotsOnTarget, awayTodos.shots) +
                weights.ultimos5 * safeDiv(awayU5.shotsOnTarget, awayU5.shots) +
                weights.ultimos5LocalVisita * safeDiv(awayU5LV.shotsOnTarget, awayU5LV.shots);
            // ---- xG ajustado por volumen de tiro ----
            // const xGLocalMatch = golesEsperadosLocal * (0.8 + shotFactorLocal);
            // const xGAwayMatch = golesEsperadosVisita * (0.8 + shotFactorAway);
            // const xgTotal = xGLocalMatch + xGAwayMatch;

            // console.log({ xGLocalMatch, xGAwayMatch, xgTotal })

            // ---- Eficiencia ofensiva: goles reales / xG, blend ponderado ----
            const eficienciaOfensivaLocal = weightedBlend(
                safeDiv(homeTodos.goalsFor, homeTodos.xGFor),
                safeDiv(homeU5.goalsFor, homeU5.xGFor),
                safeDiv(homeU5LV.goalsFor, homeU5LV.xGFor),
                weights
            );
            const eficienciaOfensivaAway = weightedBlend(
                safeDiv(awayTodos.goalsFor, awayTodos.xGFor),
                safeDiv(awayU5.goalsFor, awayU5.xGFor),
                safeDiv(awayU5LV.goalsFor, awayU5LV.xGFor),
                weights
            );


            // ---- Eficiencia bruta: goles reales / remates, blend ponderado ----
            const eficienciaLocal = weightedBlend(
                safeDiv(homeTodos.goalsFor, homeTodos.shots),
                safeDiv(homeU5.goalsFor, homeU5.shots),
                safeDiv(homeU5LV.goalsFor, homeU5LV.shots),
                weights
            );
            const eficienciaVisita = weightedBlend(
                safeDiv(awayTodos.goalsFor, awayTodos.shots),
                safeDiv(awayU5.goalsFor, awayU5.shots),
                safeDiv(awayU5LV.goalsFor, awayU5LV.shots),
                weights
            );

            // ---- Volatilidad: dispersión del xG entre los 3 bloques ----
            const homeVolatility = stdDev3([homeTodos.xGFor, homeU5.xGFor, homeU5LV.xGFor]);
            const awayVolatility = stdDev3([awayTodos.xGFor, awayU5.xGFor, awayU5LV.xGFor]);
            const volatilidad = (homeVolatility + awayVolatility) / 2;

            // ---- Caída de precisión: precisión histórica vs precisión reciente ----
            const precisionDropLocal =
                safeDiv(homeTodos.shotsOnTarget, homeTodos.shots) -
                safeDiv(homeU5.shotsOnTarget, homeU5.shots);
            const precisionDropAway =
                safeDiv(awayTodos.shotsOnTarget, awayTodos.shots) -
                safeDiv(awayU5.shotsOnTarget, awayU5.shots);

            // ---- Tiros Promedio: tiros ponderados de los 3 bloques----

            const shotsHomePonderado = ((weights.todos * homeTodos.shots) +
                (weights.ultimos5 * homeU5.shots) +
                (weights.ultimos5LocalVisita * homeU5LV.shots));
            const shotsAwayPonderado = ((weights.todos * awayTodos.shots) +
                (weights.ultimos5 * awayU5.shots) +
                (weights.ultimos5LocalVisita * awayU5LV.shots));


            // console.log({ homeAll: homeTodos.shotsOnTarget, home5: homeU5.shotsOnTarget, home5LV: homeU5LV.shotsOnTarget })
            // ---- Tiros al arco promedio: tiros ponderados de los 3 bloques----

            const shotsOTHomePonderado = ((weights.todos * homeTodos.shotsOnTarget) +
                (weights.ultimos5 * homeU5.shotsOnTarget) +
                (weights.ultimos5LocalVisita * homeU5LV.shotsOnTarget));

            const shotsOTAwayPonderado = ((weights.todos * awayTodos.shotsOnTarget) +
                (weights.ultimos5 * awayU5.shotsOnTarget) +
                (weights.ultimos5LocalVisita * awayU5LV.shotsOnTarget));


            const cornersHomePonderado = ((weights.todos * homeTodos.corners) +
                (weights.ultimos5 * homeU5.corners) +
                (weights.ultimos5LocalVisita * homeU5LV.corners));

            const cornersAwayPonderado = ((weights.todos * awayTodos.corners) +
                (weights.ultimos5 * awayU5.corners) +
                (weights.ultimos5LocalVisita * awayU5LV.corners));

            const defensiveLocal = safeDiv(xGATotalLocal, golesRecibidosLocal);
            const defensiveEfficiencyLocal = normalize(defensiveLocal, 0.5, 1.5)
            const defensiveVisita = safeDiv(xGATotalVisita, golesRecibidosVisita);
            const defensiveEfficiencyVisita = normalize(defensiveVisita, 0.5, 1.5)

            const cornersPromedio = (0.5 * (cornersHomePonderado + cornersAwayPonderado)) + (0.5 * ((shotsHomePonderado + shotsAwayPonderado) * 0.3))
            // const homeLambdaClassic =

            //     0.40 * xGTotalLocal +

            //     0.25 * xGATotalVisita +

            //     0.15 * shotFactorLocal +

            //     0.10 * eficienciaOfensivaLocal +
            //     0.10 * defensiveEfficiencyVisita +

            //     0.05 * eficienciaLocal -

            //     0.05 * volatilidad;

            // const awayLambdaClassic =

            //     0.40 * xGTotalesVisita +

            //     0.25 * xGATotalLocal +

            //     0.15 * shotFactorAway +

            //     0.10 * eficienciaOfensivaAway +

            //     0.05 * eficienciaVisita -

            //     0.05 * volatilidad;
            const chanceQualityLocal = safeDiv(xGTotalLocal, shotsHomePonderado);
            const chanceQualityAway = safeDiv(xGTotalesVisita, shotsAwayPonderado);
            const shotAccuracyLocal = safeDiv(shotsOTHomePonderado, shotsHomePonderado);
            const shotAccuracyAway = safeDiv(shotsOTAwayPonderado, shotsAwayPonderado);
            const xGRating =
                normalize(xGTotalLocal, 0, 3);

            const xGARating =
                normalize(xGATotalLocal, 0, 3);

            const shotRating =
                normalize(shotFactorLocal, 0, 1);

            const efficiencyRating =
                normalize(eficienciaOfensivaLocal, 0, 2);
            const xGRatingAway =
                normalize(xGTotalesVisita, 0, 3);

            const xGARatingAway =
                normalize(xGATotalVisita, 0, 3);

            const shotRatingAway =
                normalize(shotFactorAway, 0, 1);

            const efficiencyRatingAway =
                normalize(eficienciaOfensivaAway, 0, 2);

            const chanceQualityRating = normalize(chanceQualityLocal, 0.1, 0.4);
            const chanceQualityRatingAway = normalize(chanceQualityAway, 0.1, 0.4)
            const attackRating =
                0.35 * xGRating +
                0.20 * shotRating +
                0.20 * efficiencyRating +
                0.15 * normalize(eficienciaLocal, 0, 0.3) +
                0.10 * chanceQualityRating;

            const attackRatingAway =
                0.35 * xGRatingAway +
                0.20 * shotRatingAway +
                0.20 * efficiencyRatingAway +
                0.15 * normalize(eficienciaVisita, 0, 0.3) +
                0.10 * chanceQualityRatingAway;

            const consistency = 1 - normalize(volatilidad, 0, 1);
            const defenseRating = 0.50 * (1 - xGARating) + 0.25 * (1 - normalize(precisionDropLocal, -0.5, 0.5)) + 0.25 * (1 - normalize(volatilidad, 0, 1));
            const defenseRatingAway = 0.50 * (1 - xGARatingAway) + 0.25 * (1 - normalize(precisionDropAway, -0.5, 0.5)) + 0.25 * (1 - normalize(volatilidad, 0, 1));

            const momentum = safeDiv(homeU5.xGFor - homeTodos.xGFor, homeTodos.xGFor);
            const momentumAway = safeDiv(awayU5.xGFor - awayTodos.xGFor, awayTodos.xGFor);

            const momentumRating = normalize(momentum, -1, 1);
            const momentumRatingAway = normalize(momentumAway, -1, 1);
            const teamStrength =
                0.35 * attackRating +
                0.35 * defenseRating +
                0.20 * momentumRating +
                0.10 * consistency;

            const teamStrengthAway =
                0.35 * attackRatingAway +
                0.35 * defenseRatingAway +
                0.20 * momentumRatingAway +
                0.10 * consistency;


            const homeLambda =
                0.55 * xGTotalLocal +
                0.20 * xGATotalVisita +
                0.15 * teamStrength +
                0.05 * momentumRating +
                0.05 * consistency;


            const awayLambda =
                0.55 * xGTotalesVisita +
                0.20 * xGATotalLocal +
                0.15 * teamStrengthAway +
                0.05 * momentumAway +
                0.05 * consistency;

            const chanceQuality =

                safeDiv(xGTotalLocal,

                    shotsHomePonderado);

            const shotAccuracy =

                safeDiv(

                    shotsOTHomePonderado,

                    shotsHomePonderado

                );

            //  const goalConversion =

            //      safeDiv(
            //         golesEsperadosLocal,
            //          shotsOTHomePonderado
            //      );

            // const finishing =

            //     safeDiv(

            //         golesEsperadosLocal,

            //         xGTotalLocal

            //     );

            // console.log({ homeLambda, goalConversion, finishing })
            const buildTeamMetrics = (
                xG: number,
                xGA: number,
                expectedGoals: number,
                shotFactor: number,
                offensiveEfficiency: number,
                efficiency: number,
                precisionDrop: number,
                corners: number,
                shots: number,
                shotOT: number
            ): TeamMetrics => ({
                xG: +xG.toFixed(3),
                xGA: +xGA.toFixed(3),
                expectedGoals: +expectedGoals.toFixed(3),
                shotFactor: +shotFactor.toFixed(3),
                offensiveEfficiency: +offensiveEfficiency.toFixed(3),
                efficiency: +efficiency.toFixed(3),
                precisionDrop: +precisionDrop.toFixed(3),
                corners: +corners.toFixed(3),
                shots: +shots.toFixed(3),
                shotsOT: +shotOT.toFixed(3)

            });

            const expectedGoals = Number(homeLambda + awayLambda.toFixed(3))
            const metrics: MatchMetrics = {
                home: buildTeamMetrics(
                    homeLambda,
                    xGATotalLocal,
                    homeLambda,
                    shotFactorLocal,
                    eficienciaOfensivaLocal,
                    eficienciaLocal,
                    precisionDropLocal,
                    cornersHomePonderado,
                    shotsHomePonderado,
                    shotsOTHomePonderado

                ),

                away: buildTeamMetrics(
                    awayLambda,
                    xGATotalVisita,
                    awayLambda,
                    shotFactorAway,
                    eficienciaOfensivaAway,
                    eficienciaVisita,
                    precisionDropAway,
                    cornersAwayPonderado,
                    shotsAwayPonderado,
                    shotsOTAwayPonderado
                ),

                match: {
                    xG: expectedGoals,
                    expectedGoals,
                    // expectedGoals: +golesEsperados.toFixed(3),
                    volatility: +volatilidad.toFixed(3),
                    corners: +cornersPromedio.toFixed(3)
                },
            };

            // return {
            //     matchUrl: match.matchUrl,
            //     competitionName: game.competitionDisplayName,
            //     startTime: game.startTime,
            //     home: { teamId: homeId, teamName: game.homeCompetitor.name },
            //     away: { teamId: awayId, teamName: game.awayCompetitor.name },
            //     metrics,
            // };
            return {
                matchUrl: match.matchUrl,
                competitionName: game.competitionDisplayName,
                startTime: game.startTime,
                home: { teamId: homeId, teamName: game.homeCompetitor.name, metrics: metrics.home },
                away: { teamId: awayId, teamName: game.awayCompetitor.name, metrics: metrics.away },
                matchMetrics: metrics.match,
            } satisfies UnifiedMatch;
        })
        .filter((m): m is UnifiedMatch => m !== null);
}