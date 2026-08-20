import { ExternalTeamStat, ExternalMatchStats } from "@/types/externalStats";
import { TeamMetrics, UnifiedMatch } from "@/types/unifiedStats";
import { dixonColesProbabilities } from "./dixonColes";

// ============================================================
// Utilidades internas de Poisson
// ============================================================

function factorial(n: number): number {
    return n <= 1 ? 1 : n * factorial(n - 1);
}

function poissonP(lambda: number, k: number): number {
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function poissonOverProb(lambda: number, line: number): number {
    const threshold = Math.floor(line) + 1;
    let cumulativeUnder = 0;
    for (let k = 0; k < threshold; k++) {
        cumulativeUnder += poissonP(lambda, k);
    }
    return Math.min(Math.max(1 - cumulativeUnder, 0), 1);
}

function toFairOdd(prob: number): number {
    return prob > 0 ? +(1 / prob).toFixed(2) : 0;
}

function buildGoalLineMarket(overProb: number): GoalLineMarket {
    const underProb = 1 - overProb;
    return {
        line: 0,
        overProb: +(overProb * 100).toFixed(1),
        underProb: +(underProb * 100).toFixed(1),
        overOdd: toFairOdd(overProb),
        underOdd: toFairOdd(underProb),
    };
}

// ============================================================
// Tipos
// ============================================================
export interface TeamGoalMarket {
    line: number;
    overProb: number;
    underProb: number;
    overOdd: number;
    underOdd: number;
}

export interface WinToNilMarket {
    home: ProbabilityMarket;
    away: ProbabilityMarket;
}

export interface CleanSheetMarket {
    home: ProbabilityMarket;
    away: ProbabilityMarket;
}
export interface TrapAnalysis {
    score: number;
    level: "SAFE" | "CAUTION" | "DANGER";
    confidence: number;
    reasons: string[];
}
export interface ResultBTTSMarket {
    homeYes: ProbabilityMarket;
    homeNo: ProbabilityMarket;
    drawYes: ProbabilityMarket;
    drawNo: ProbabilityMarket;
    awayYes: ProbabilityMarket;
    awayNo: ProbabilityMarket;
}
export interface GoalLineMarket {
    line: number;
    overProb: number;
    underProb: number;
    overOdd: number;
    underOdd: number;
}
export interface ProbabilityMarket {
    prob: number;
    odd: number;
}
export interface ExtendedMatchPrediction {
    homeExpectedGoals: number;
    awayExpectedGoals: number;
    moneyline: {
        homeWin: ProbabilityMarket;
        draw: ProbabilityMarket;
        awayWin: ProbabilityMarket;
    };
    btts: {
        yes: ProbabilityMarket;
        no: ProbabilityMarket;
    };
    goalLines: GoalLineMarket[];
    corners: {
        expectedTotal: number;
        lines: GoalLineMarket[];
    };
    volatility?: number;
    doubleChance: {
        homeOrDraw: ProbabilityMarket;
        drawOrAway: ProbabilityMarket;
        noDraw: ProbabilityMarket;
    };

    drawNoBet: {
        home: ProbabilityMarket;
        away: ProbabilityMarket;
    };
    teamGoals: {
        home: TeamGoalMarket[];
        away: TeamGoalMarket[];
    };

    winToNil: WinToNilMarket;

    cleanSheet: CleanSheetMarket;

    resultBTTS: ResultBTTSMarket;
    exactScores: ExactScore[];
    trapAnalysis: TrapAnalysis
}

export interface PredictionOptions {
    maxGoals?: number;
    goalLines?: number[];
    cornerLines?: number[];
    rho?: number;
}
export interface ExactScore {
    homeGoals: number;
    awayGoals: number;
    probability: number;
    odd: number;
}
const DEFAULT_GOAL_LINES = [0.5, 1.5, 2.5, 3.5, 4.5];
const DEFAULT_CORNER_LINES = [6.5, 7.5, 8.5, 9.5, 10.5, 11.5];
const DEFAULT_MAX_GOALS = 10;

// ============================================================
// Calcula la predicción de UN partido
// ============================================================

export function calculateExtendedPrediction(home: TeamMetrics, away: TeamMetrics, options: PredictionOptions = {}, volatility: number): ExtendedMatchPrediction {
    const maxGoals = options.maxGoals ?? DEFAULT_MAX_GOALS;
    const goalLinesConfig = options.goalLines ?? DEFAULT_GOAL_LINES;
    const cornerLinesConfig = options.cornerLines ?? DEFAULT_CORNER_LINES;
    const homeExpectedGoals = home.expectedGoals ?? 0.1;
    const awayExpectedGoals = away.expectedGoals ?? 0.1;

    const homeGoalsOver: Record<number, number> = {};
    const awayGoalsOver: Record<number, number> = {};
    DEFAULT_GOAL_LINES.forEach(line => {
        homeGoalsOver[line] = 0;
        awayGoalsOver[line] = 0;
    });
    let homeWin = 0;
    let draw = 0;
    let awayWin = 0;
    let bttsYes = 0;
    let homeWinToNil = 0;
    let awayWinToNil = 0;

    let homeCleanSheet = 0;
    let awayCleanSheet = 0;

    let homeWinBTTS = 0;
    let homeWinNoBTTS = 0;

    let drawBTTS = 0;
    let drawNoBTTS = 0;

    let awayWinBTTS = 0;
    let awayWinNoBTTS = 0;
    const goalLineOverAcc: Record<number, number> = {};
    goalLinesConfig.forEach((line) => (goalLineOverAcc[line] = 0));


    function getExactScores(scoreMatrix: number[][], maxResults = 10): ExactScore[] {

        const scores: ExactScore[] = [];

        for (let h = 0; h < scoreMatrix.length; h++) {
            for (let a = 0; a < scoreMatrix[h].length; a++) {

                const prob = scoreMatrix[h][a];

                scores.push({
                    homeGoals: h,
                    awayGoals: a,
                    probability: +(prob * 100).toFixed(2),
                    odd: toFairOdd(prob)
                });

            }
        }


        return scores
            .sort((a, b) => b.probability - a.probability)
            .slice(0, maxResults);
    }
    function calculateTrapScore(
        homeExpectedGoals: number,
        awayExpectedGoals: number,
        homeWin: number,
        draw: number,
        awayWin: number,
        bttsYes: number,
        exactScores: ExactScore[],
        volatility: number = 0
    ): TrapAnalysis {


        let score = 0;
        const reasons: string[] = [];


        /*
        =====================================
        1. Incertidumbre marcador exacto
        =====================================
        */

        const bestScore = exactScores[0]?.probability ?? 0;


        if (bestScore < 15) {

            score += 20;

            reasons.push(
                "Marcador exacto muy repartido"
            );

        }


        if (
            exactScores[0] &&
            exactScores[1] &&
            exactScores[0].probability -
            exactScores[1].probability < 3
        ) {

            score += 10;

            reasons.push(
                "No existe marcador dominante"
            );

        }



        /*
        =====================================
        2. Favorito con empate peligroso
        =====================================
        */

        const favorite =
            Math.max(
                homeWin,
                awayWin
            );


        if (
            favorite > 0.55 &&
            draw > 0.25
        ) {

            score += 20;

            reasons.push(
                "Favorito vulnerable al empate"
            );

        }



        /*
        =====================================
        3. xG bajo
        =====================================
        */


        const totalXG =
            homeExpectedGoals +
            awayExpectedGoals;


        if (totalXG < 2) {

            score += 15;

            reasons.push(
                "Partido con pocos goles esperados"
            );

        }



        /*
        =====================================
        4. Favorito pero BTTS alto
        =====================================
        */


        if (
            favorite > 0.60 &&
            bttsYes > 0.60
        ) {

            score += 15;

            reasons.push(
                "Favorito pero ambos pueden marcar"
            );

        }



        /*
        =====================================
        5. Diferencia entre fuerzas
        =====================================
        */


        const xgDifference =
            Math.abs(
                homeExpectedGoals -
                awayExpectedGoals
            );


        if (
            xgDifference > 1 &&
            favorite < 0.60
        ) {

            score += 15;

            reasons.push(
                "Dominio estadístico no reflejado"
            );

        }



        /*
        =====================================
        6. Volatilidad
        =====================================
        */


        if (volatility > 0.60) {

            score += 20;

            reasons.push(
                "Alta volatilidad"
            );

        }



        score = Math.min(
            score,
            100
        );


        return {

            score,


            level:
                score >= 60
                    ?
                    "DANGER"
                    :
                    score >= 30
                        ?
                        "CAUTION"
                        :
                        "SAFE",


            confidence:
                +(100 - score).toFixed(1),


            reasons

        };

    }

    const { scoreMatrix } = dixonColesProbabilities(
        homeExpectedGoals,
        awayExpectedGoals,
        maxGoals,
        options.rho ?? -0.10
    );

    const exactScores = getExactScores(scoreMatrix, 10);
    const trapAnalysis = calculateTrapScore(
        homeExpectedGoals,
        awayExpectedGoals,
        homeWin,
        draw,
        awayWin,
        bttsYes,
        exactScores,
        volatility

    );
    for (let h = 0; h <= maxGoals; h++) {
        for (let a = 0; a <= maxGoals; a++) {
            // const p = poissonP(homeExpectedGoals, h) * poissonP(awayExpectedGoals, a);
            // const p =
            //     poissonP(homeExpectedGoals, h) *
            //     poissonP(awayExpectedGoals, a) *
            //     tau(h, a, homeExpectedGoals, awayExpectedGoals, rho);
            const p = scoreMatrix[h][a];

            if (h > a) homeWin += p;
            else if (h === a) draw += p;
            else awayWin += p;

            if (h > 0 && a > 0) bttsYes += p;

            const totalGoals = h + a;

            for (const line of goalLinesConfig) {
                if (totalGoals > line)
                    goalLineOverAcc[line] += p;
            }
            //==============================
            // Team Goals
            //==============================
            DEFAULT_GOAL_LINES.forEach(line => {

                if (h > line)
                    homeGoalsOver[line] += p;

                if (a > line)
                    awayGoalsOver[line] += p;

            });

            //==============================
            // Clean Sheet
            //==============================

            if (a === 0)
                homeCleanSheet += p;

            if (h === 0)
                awayCleanSheet += p;


            //==============================
            // Win To Nil
            //==============================

            if (h > a && a === 0)
                homeWinToNil += p;

            if (a > h && h === 0)
                awayWinToNil += p;


            //==============================
            // Resultado + BTTS
            //==============================

            if (h > a) {

                if (a > 0)
                    homeWinBTTS += p;
                else
                    homeWinNoBTTS += p;

            }

            else if (a > h) {

                if (h > 0)
                    awayWinBTTS += p;
                else
                    awayWinNoBTTS += p;

            }

            else {

                if (h > 0)
                    drawBTTS += p;
                else
                    drawNoBTTS += p;

            }
        }
    }
    const homeTeamGoals = DEFAULT_GOAL_LINES.map(line => ({

        line,

        overProb: +(homeGoalsOver[line] * 100).toFixed(1),

        underProb: +((1 - homeGoalsOver[line]) * 100).toFixed(1),

        overOdd: toFairOdd(homeGoalsOver[line]),

        underOdd: toFairOdd(1 - homeGoalsOver[line])

    }));

    const awayTeamGoals = DEFAULT_GOAL_LINES.map(line => ({

        line,

        overProb: +(awayGoalsOver[line] * 100).toFixed(1),

        underProb: +((1 - awayGoalsOver[line]) * 100).toFixed(1),

        overOdd: toFairOdd(awayGoalsOver[line]),

        underOdd: toFairOdd(1 - awayGoalsOver[line])

    }));
    const bttsNo = 1 - bttsYes;

    // =============================
    // Doble Oportunidad
    // =============================
    const dolbeOPLocal = homeWin + draw
    const dolbeOPVisita = awayWin + draw
    const localOVisita = homeWin + awayWin

    // =============================
    // Draw No Bet
    // =============================

    const noDrawTotal = homeWin + awayWin;

    const drawNoBetHome =
        noDrawTotal > 0
            ? homeWin / noDrawTotal
            : 0;

    const drawNoBetAway =
        noDrawTotal > 0
            ? awayWin / noDrawTotal
            : 0;

    const goalLines: GoalLineMarket[] = goalLinesConfig.map((line) => ({
        ...buildGoalLineMarket(goalLineOverAcc[line]),
        line,
    }));


    // const expectedTotalCorners = home.corners + away.corners || 1;
    const expectedTotalCorners =
        home.corners +
        away.corners +
        0.12 * (
            home.shots +
            away.shots -
            24
        );
    const cornerLines: GoalLineMarket[] = cornerLinesConfig.map((line) => {
        const overProb = poissonOverProb(expectedTotalCorners, line);
        return { ...buildGoalLineMarket(overProb), line };
    });


    return {
        homeExpectedGoals: +homeExpectedGoals.toFixed(2),
        awayExpectedGoals: +awayExpectedGoals.toFixed(2),
        moneyline: {
            homeWin: { prob: +(homeWin * 100).toFixed(1), odd: toFairOdd(homeWin) },
            draw: { prob: +(draw * 100).toFixed(1), odd: toFairOdd(draw) },
            awayWin: { prob: +(awayWin * 100).toFixed(1), odd: toFairOdd(awayWin) },
        },
        doubleChance: {
            homeOrDraw: {
                prob: +(dolbeOPLocal * 100).toFixed(1),
                odd: toFairOdd(dolbeOPLocal),
            },

            drawOrAway: {
                prob: +(dolbeOPVisita * 100).toFixed(1),
                odd: toFairOdd(dolbeOPVisita),
            },

            noDraw: {
                prob: +(localOVisita * 100).toFixed(1),
                odd: toFairOdd(localOVisita),
            },
        },

        drawNoBet: {
            home: {
                prob: +(drawNoBetHome * 100).toFixed(1),
                odd: toFairOdd(drawNoBetHome),
            },

            away: {
                prob: +(drawNoBetAway * 100).toFixed(1),
                odd: toFairOdd(drawNoBetAway),
            },
        },
        btts: {
            yes: { prob: +(bttsYes * 100).toFixed(1), odd: toFairOdd(bttsYes) },
            no: { prob: +(bttsNo * 100).toFixed(1), odd: toFairOdd(bttsNo) },
        },
        goalLines,
        corners: {
            expectedTotal: +expectedTotalCorners.toFixed(2),
            lines: cornerLines,
        },
        // NUEVO
        teamGoals: {
            home: homeTeamGoals,
            away: awayTeamGoals,
        },
        // NUEVO
        winToNil: {
            home: {
                prob: +(homeWinToNil * 100).toFixed(1),
                odd: toFairOdd(homeWinToNil),
            },
            away: {
                prob: +(awayWinToNil * 100).toFixed(1),
                odd: toFairOdd(awayWinToNil),
            },
        },

        // NUEVO
        cleanSheet: {
            home: {
                prob: +(homeCleanSheet * 100).toFixed(1),
                odd: toFairOdd(homeCleanSheet),
            },
            away: {
                prob: +(awayCleanSheet * 100).toFixed(1),
                odd: toFairOdd(awayCleanSheet),
            },
        },

        // NUEVO
        resultBTTS: {
            homeYes: {
                prob: +(homeWinBTTS * 100).toFixed(1),
                odd: toFairOdd(homeWinBTTS),
            },
            homeNo: {
                prob: +(homeWinNoBTTS * 100).toFixed(1),
                odd: toFairOdd(homeWinNoBTTS),
            },
            drawYes: {
                prob: +(drawBTTS * 100).toFixed(1),
                odd: toFairOdd(drawBTTS),
            },
            drawNo: {
                prob: +(drawNoBTTS * 100).toFixed(1),
                odd: toFairOdd(drawNoBTTS),
            },
            awayYes: {
                prob: +(awayWinBTTS * 100).toFixed(1),
                odd: toFairOdd(awayWinBTTS),
            },
            awayNo: {
                prob: +(awayWinNoBTTS * 100).toFixed(1),
                odd: toFairOdd(awayWinNoBTTS),
            },
        },
        exactScores,
        trapAnalysis
    };
}

// ============================================================
// Calcula la predicción de TODOS los partidos, manteniéndolos
// separados — un resultado independiente por cada elemento del
// arreglo que devuelve parseExternalStats.
// ============================================================
// type TeamMetrics = ExternalTeamStat["metrics"];

export function calculateAllPredictions(matches: UnifiedMatch[], options: PredictionOptions = {}) {
    return matches.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map((match) => {
        console.log({ matches })
        return {
            matchUrl: match.matchUrl,
            competitionName: match.competitionName,
            startTime: match.startTime,
            home: match.home,
            away: match.away,
            prediction: calculateExtendedPrediction(match.home.metrics, match.away.metrics, options, match.matchMetrics.volatility),
            volatility: match.matchMetrics.volatility,
            recentMatches: match.recentMatches,
            estadio: match.estadio,
            tv: match.tvNetworks,
            arbitro: match.arbitro,
            h2h: match.h2h
        }
    });
}