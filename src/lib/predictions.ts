import { ExternalTeamStat, ExternalMatchStats } from "@/types/externalStats";
import { TeamMetrics, UnifiedMatch } from "@/types/unifiedStats";

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

export interface GoalLineMarket {
    line: number;
    overProb: number;
    underProb: number;
    overOdd: number;
    underOdd: number;
}

export interface ExtendedMatchPrediction {
    homeExpectedGoals: number;
    awayExpectedGoals: number;
    moneyline: {
        homeWin: { prob: number; odd: number };
        draw: { prob: number; odd: number };
        awayWin: { prob: number; odd: number };
    };
    btts: {
        yes: { prob: number; odd: number };
        no: { prob: number; odd: number };
    };
    goalLines: GoalLineMarket[];
    corners: {
        expectedTotal: number;
        lines: GoalLineMarket[];
    };
}

export interface PredictionOptions {
    maxGoals?: number;
    goalLines?: number[];
    cornerLines?: number[];
}

const DEFAULT_GOAL_LINES = [0.5, 1.5, 2.5, 3.5];
const DEFAULT_CORNER_LINES = [6.5, 7.5, 8.5, 9.5, 10.5];
const DEFAULT_MAX_GOALS = 0;

// ============================================================
// Calcula la predicción de UN partido
// ============================================================

export function calculateExtendedPrediction(home: TeamMetrics, away: TeamMetrics, options: PredictionOptions = {}): ExtendedMatchPrediction {
    const maxGoals = options.maxGoals ?? DEFAULT_MAX_GOALS;
    const goalLinesConfig = options.goalLines ?? DEFAULT_GOAL_LINES;
    const cornerLinesConfig = options.cornerLines ?? DEFAULT_CORNER_LINES;

    // console.log({ home, away })
    // const homeExpectedGoals = home.xG_local_match;
    const homeExpectedGoals = home.xG || 0.1;
    const awayExpectedGoals = away.xG || 0.1;
    // const awayExpectedGoals = away.XG_away_match;

    let homeWin = 0;
    let draw = 0;
    let awayWin = 0;
    let bttsYes = 0;

    const goalLineOverAcc: Record<number, number> = {};
    goalLinesConfig.forEach((line) => (goalLineOverAcc[line] = 0));

    for (let h = 0; h <= maxGoals; h++) {
        for (let a = 0; a <= maxGoals; a++) {
            const p = poissonP(homeExpectedGoals, h) * poissonP(awayExpectedGoals, a);

            if (h > a) homeWin += p;
            else if (h === a) draw += p;
            else awayWin += p;

            if (h > 0 && a > 0) bttsYes += p;

            const totalGoals = h + a;
            goalLinesConfig.forEach((line) => {
                if (totalGoals > line) goalLineOverAcc[line] += p;
            });
        }
    }

    const bttsNo = 1 - bttsYes;

    const goalLines: GoalLineMarket[] = goalLinesConfig.map((line) => ({
        ...buildGoalLineMarket(goalLineOverAcc[line]),
        line,
    }));

    const expectedTotalCorners = home.corners + away.corners || 1;
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
        btts: {
            yes: { prob: +(bttsYes * 100).toFixed(1), odd: toFairOdd(bttsYes) },
            no: { prob: +(bttsNo * 100).toFixed(1), odd: toFairOdd(bttsNo) },
        },
        goalLines,
        corners: {
            expectedTotal: +expectedTotalCorners.toFixed(2),
            lines: cornerLines,
        },
    };
}

// ============================================================
// Calcula la predicción de TODOS los partidos, manteniéndolos
// separados — un resultado independiente por cada elemento del
// arreglo que devuelve parseExternalStats.
// ============================================================
// type TeamMetrics = ExternalTeamStat["metrics"];

export function calculateAllPredictions(matches: UnifiedMatch[], options: PredictionOptions = {}) {
    console.log({ matches })
    return matches.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map((match) => ({
        matchUrl: match.matchUrl,
        competitionName: match.competitionName,
        startTime: match.startTime,
        home: match.home,
        away: match.away,
        prediction: calculateExtendedPrediction(match.home.metrics, match.away.metrics, options),
    }));
}