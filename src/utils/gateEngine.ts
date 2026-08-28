// // import { ExtendedMatchPrediction, ProbabilityMarket, TeamGoalMarket } from "@/lib/predictions";
// // import { TeamMetrics } from "@/types";

// // export type GateStatus =
// //     | "PASS"
// //     | "FAIL";

// // export interface GateResult {

// //     status: GateStatus;

// //     passed: boolean;

// //     reasons: string[];

// // }

// // export const GATE_CONFIG = {
// //     moneyline: {
// //         minProbability: 58,
// //         minLambda: 1.45,
// //         maxOpponentLambda: 1.10,
// //         minLambdaDifference: 0.45,
// //     },
// //     btts: {
// //         minProbability: 60,
// //         minLambda: 1.15,
// //         minOpponentXGA: 1.00,
// //         maxVolatility: 0.45,
// //     },
// //     over25: {
// //         minProbability: 58,
// //         minTotalLambda: 2.60,
// //     },
// //     under25: {
// //         minProbability: 58,
// //         maxTotalLambda: 2.20,
// //     },
// //     // ...
// // } as const;

// // function pass(result: string[] = []): GateResult {

// //     return {

// //         status: "PASS",

// //         passed: true,

// //         reasons: result

// //     };

// // }

// // function fail(...reasons: string[]): GateResult {

// //     return {

// //         status: "FAIL",

// //         passed: false,

// //         reasons

// //     };

// // }

// // export function passMoneylineGate(home: TeamMetrics, away: TeamMetrics, prediction: ExtendedMatchPrediction, side: "home" | "away"): GateResult {

// //     const homeLambda = home.expectedGoals;
// //     const awayLambda = away.expectedGoals;

// //     const probability = side === "home" ? prediction.moneyline.homeWin.prob : prediction.moneyline.awayWin.prob;

// //     const lambdaDifference = Math.abs(homeLambda - awayLambda);


// //     if (probability < 58)
// //         return fail("Probabilidad demasiado baja");

// //     if (lambdaDifference < 0.45)
// //         return fail("Los equipos generan un volumen ofensivo similar");

// //     if (side === "home") {

// //         if (homeLambda < 1.45)
// //             return fail("El local genera poco ataque");

// //         if (awayLambda > 1.10)
// //             return fail("El visitante también genera peligro");

// //     } else {

// //         if (awayLambda < 1.45)
// //             return fail("El visitante genera poco ataque");

// //         if (homeLambda > 1.10)
// //             return fail("El local genera peligro");

// //     }

// //     return pass();

// // }

// // export function passBTTSGate(

// //     home: TeamMetrics,

// //     away: TeamMetrics,

// //     prediction: ExtendedMatchPrediction,

// //     volatility: number

// // ): GateResult {


// //     if (home.expectedGoals < 1.15)
// //         return fail("Local con λ demasiado bajo");

// //     if (away.expectedGoals < 1.15)
// //         return fail("Visitante con λ demasiado bajo");

// //     if (home.xGA < 1.0)
// //         return fail("Local concede muy pocas ocasiones");

// //     if (away.xGA < 1.0)
// //         return fail("Visitante concede muy pocas ocasiones");

// //     if (prediction.btts.yes.prob < 60)
// //         return fail("Modelo BTTS insuficiente");

// //     if (volatility > 0.45)
// //         return fail("Partido demasiado volátil");


// //     return pass();

// // }

// // export function passOver25Gate(

// //     home: TeamMetrics,

// //     away: TeamMetrics,

// //     prediction: ExtendedMatchPrediction

// // ): GateResult {


// //     const totalLambda =
// //         home.expectedGoals +
// //         away.expectedGoals;


// //     const over =
// //         prediction.goalLines.find(
// //             g => g.line === 2.5
// //         );


// //     if (!over)
// //         return fail("No existe mercado");

// //     if (totalLambda < 2.60)
// //         return fail("Pocos goles esperados");

// //     if (over.overProb < 58)
// //         return fail("Probabilidad Over baja");

// //     return pass();

// // }

// // export function passUnder25Gate(

// //     home: TeamMetrics,

// //     away: TeamMetrics,

// //     prediction: ExtendedMatchPrediction

// // ): GateResult {


// //     const totalLambda =
// //         home.expectedGoals +
// //         away.expectedGoals;


// //     const under =
// //         prediction.goalLines.find(
// //             g => g.line === 2.5
// //         );


// //     if (!under)
// //         return fail("No existe mercado");

// //     if (totalLambda > 2.20)
// //         return fail("Muchos goles esperados");

// //     if (under.underProb < 58)
// //         return fail("Probabilidad Under baja");

// //     return pass();

// // }

// // export function passDoubleChanceGate(

// //     prediction: ExtendedMatchPrediction,

// //     side: "1X" | "X2"

// // ): GateResult {


// //     const probability =
// //         side === "1X"
// //             ? prediction.doubleChance.homeOrDraw.prob
// //             : prediction.doubleChance.drawOrAway.prob;


// //     if (probability < 72)
// //         return fail("Probabilidad insuficiente");


// //     return pass();

// // }

// // export function passTeamGoalsGate(

// //     team: TeamMetrics,

// //     prediction: TeamGoalMarket[],

// //     line: number

// // ): GateResult {


// //     const market =
// //         prediction.find(
// //             g => g.line === line
// //         );


// //     if (!market)
// //         return fail("No existe línea");

// //     if (team.expectedGoals < line + 0.60)
// //         return fail("λ insuficiente");

// //     if (market.overProb < 60)
// //         return fail("Modelo insuficiente");


// //     return pass();

// // }

// // export function passCleanSheetGate(

// //     prediction: ExtendedMatchPrediction,

// //     side: "home" | "away"

// // ): GateResult {


// //     const probability =
// //         side === "home"
// //             ? prediction.cleanSheet.home.prob
// //             : prediction.cleanSheet.away.prob;


// //     if (probability < 55)
// //         return fail("Probabilidad insuficiente");


// //     return pass();

// // }

// // export function passWinToNilGate(

// //     prediction: ExtendedMatchPrediction,

// //     side: "home" | "away"

// // ): GateResult {


// //     const probability =
// //         side === "home"
// //             ? prediction.winToNil.home.prob
// //             : prediction.winToNil.away.prob;


// //     if (probability < 35)
// //         return fail("Probabilidad insuficiente");


// //     return pass();

// // }

// // export function passResultBTTSGate(market: ProbabilityMarket): GateResult {

// //     if (market.prob < 22)
// //         return fail("Probabilidad demasiado baja");

// //     return pass();
// // }

// import { ExtendedMatchPrediction, ProbabilityMarket, TeamGoalMarket } from "@/lib/predictions";
// import { TeamMetrics } from "@/types";

// export type GateStatus =
//     | "PASS"
//     | "FAIL";

// export interface GateResult {

//     status: GateStatus;

//     passed: boolean;

//     reasons: string[];

// }

// export const GATE_CONFIG = {
//     moneyline: {
//         minProbability: 58,
//         minLambda: 1.45,
//         maxOpponentLambda: 1.10,
//         minLambdaDifference: 0.45,
//     },
//     btts: {
//         minProbability: 60,
//         minLambda: 1.15,
//         minOpponentXGA: 1.00,
//         maxVolatility: 0.45,
//     },
//     over25: {
//         minProbability: 58,
//         minTotalLambda: 2.60,
//     },
//     under25: {
//         minProbability: 58,
//         maxTotalLambda: 2.20,
//     },
//     // ...
// } as const;

// function pass(result: string[] = []): GateResult {

//     return {

//         status: "PASS",

//         passed: true,

//         reasons: result

//     };

// }

// function fail(...reasons: string[]): GateResult {

//     return {

//         status: "FAIL",

//         passed: false,

//         reasons

//     };

// }

// export function passMoneylineGate(home: TeamMetrics, away: TeamMetrics, prediction: ExtendedMatchPrediction, side: "home" | "away"): GateResult {

//     const homeLambda = home.expectedGoals;
//     const awayLambda = away.expectedGoals;

//     const probability = side === "home" ? prediction.moneyline.homeWin.prob : prediction.moneyline.awayWin.prob;

//     const lambdaDifference = Math.abs(homeLambda - awayLambda);


//     if (probability < 58)
//         return fail("Probabilidad demasiado baja");

//     if (lambdaDifference < 0.45)
//         return fail("Los equipos generan un volumen ofensivo similar");

//     if (side === "home") {

//         if (homeLambda < 1.45)
//             return fail("El local genera poco ataque");

//         if (awayLambda > 1.10)
//             return fail("El visitante también genera peligro");

//     } else {

//         if (awayLambda < 1.45)
//             return fail("El visitante genera poco ataque");

//         if (homeLambda > 1.10)
//             return fail("El local genera peligro");

//     }

//     return pass();

// }

// export function passBTTSGate(

//     home: TeamMetrics,

//     away: TeamMetrics,

//     prediction: ExtendedMatchPrediction,

//     volatility: number

// ): GateResult {


//     if (home.expectedGoals < 1.15)
//         return fail("Local con λ demasiado bajo");

//     if (away.expectedGoals < 1.15)
//         return fail("Visitante con λ demasiado bajo");

//     if (home.xGA < 1.0)
//         return fail("Local concede muy pocas ocasiones");

//     if (away.xGA < 1.0)
//         return fail("Visitante concede muy pocas ocasiones");

//     if (prediction.btts.yes.prob < 60)
//         return fail("Modelo BTTS insuficiente");

//     if (volatility > 0.45)
//         return fail("Partido demasiado volátil");


//     return pass();

// }

// export function passOver25Gate(

//     home: TeamMetrics,

//     away: TeamMetrics,

//     prediction: ExtendedMatchPrediction

// ): GateResult {


//     const totalLambda =
//         home.expectedGoals +
//         away.expectedGoals;


//     const over =
//         prediction.goalLines.find(
//             g => g.line === 2.5
//         );


//     if (!over)
//         return fail("No existe mercado");

//     if (totalLambda < 2.60)
//         return fail("Pocos goles esperados");

//     if (over.overProb < 58)
//         return fail("Probabilidad Over baja");

//     return pass();

// }

// export function passUnder25Gate(

//     home: TeamMetrics,

//     away: TeamMetrics,

//     prediction: ExtendedMatchPrediction

// ): GateResult {


//     const totalLambda =
//         home.expectedGoals +
//         away.expectedGoals;


//     const under =
//         prediction.goalLines.find(
//             g => g.line === 2.5
//         );


//     if (!under)
//         return fail("No existe mercado");

//     if (totalLambda > 2.20)
//         return fail("Muchos goles esperados");

//     if (under.underProb < 58)
//         return fail("Probabilidad Under baja");

//     return pass();

// }

// export function passDoubleChanceGate(

//     prediction: ExtendedMatchPrediction,

//     side: "1X" | "X2"

// ): GateResult {


//     const probability =
//         side === "1X"
//             ? prediction.doubleChance.homeOrDraw.prob
//             : prediction.doubleChance.drawOrAway.prob;


//     if (probability < 72)
//         return fail("Probabilidad insuficiente");


//     return pass();

// }

// export function passTeamGoalsGate(

//     team: TeamMetrics,

//     prediction: TeamGoalMarket[],

//     line: number

// ): GateResult {


//     const market =
//         prediction.find(
//             g => g.line === line
//         );


//     if (!market)
//         return fail("No existe línea");

//     if (team.expectedGoals < line + 0.60)
//         return fail("λ insuficiente");

//     if (market.overProb < 60)
//         return fail("Modelo insuficiente");


//     return pass();

// }

// export function passCleanSheetGate(

//     prediction: ExtendedMatchPrediction,

//     side: "home" | "away"

// ): GateResult {


//     const probability =
//         side === "home"
//             ? prediction.cleanSheet.home.prob
//             : prediction.cleanSheet.away.prob;


//     if (probability < 55)
//         return fail("Probabilidad insuficiente");


//     return pass();

// }

// export function passWinToNilGate(

//     prediction: ExtendedMatchPrediction,

//     side: "home" | "away"

// ): GateResult {


//     const probability =
//         side === "home"
//             ? prediction.winToNil.home.prob
//             : prediction.winToNil.away.prob;


//     if (probability < 35)
//         return fail("Probabilidad insuficiente");


//     return pass();

// }

// export function passResultBTTSGate(market: ProbabilityMarket): GateResult {

//     if (market.prob < 22)
//         return fail("Probabilidad demasiado baja");

//     return pass();
// }

// import { ExtendedMatchPrediction, ProbabilityMarket, TeamGoalMarket } from "@/lib/predictions";
// import { TeamMetrics } from "@/types";

// export type GateStatus =
//     | "PASS"
//     | "FAIL";

// export interface GateResult {

//     status: GateStatus;

//     passed: boolean;

//     reasons: string[];

// }

// export const GATE_CONFIG = {
//     moneyline: {
//         minProbability: 58,
//         minLambda: 1.45,
//         maxOpponentLambda: 1.10,
//         minLambdaDifference: 0.45,
//     },
//     btts: {
//         minProbability: 60,
//         minLambda: 1.15,
//         minOpponentXGA: 1.00,
//         maxVolatility: 0.45,
//     },
//     over25: {
//         minProbability: 58,
//         minTotalLambda: 2.60,
//     },
//     under25: {
//         minProbability: 58,
//         maxTotalLambda: 2.20,
//     },
//     // ...
// } as const;

// function pass(result: string[] = []): GateResult {

//     return {

//         status: "PASS",

//         passed: true,

//         reasons: result

//     };

// }

// function fail(...reasons: string[]): GateResult {

//     return {

//         status: "FAIL",

//         passed: false,

//         reasons

//     };

// }

// export function passMoneylineGate(home: TeamMetrics, away: TeamMetrics, prediction: ExtendedMatchPrediction, side: "home" | "away"): GateResult {

//     const homeLambda = home.expectedGoals;
//     const awayLambda = away.expectedGoals;

//     const probability = side === "home" ? prediction.moneyline.homeWin.prob : prediction.moneyline.awayWin.prob;

//     const lambdaDifference = Math.abs(homeLambda - awayLambda);


//     if (probability < 58)
//         return fail("Probabilidad demasiado baja");

//     if (lambdaDifference < 0.45)
//         return fail("Los equipos generan un volumen ofensivo similar");

//     if (side === "home") {

//         if (homeLambda < 1.45)
//             return fail("El local genera poco ataque");

//         if (awayLambda > 1.10)
//             return fail("El visitante también genera peligro");

//     } else {

//         if (awayLambda < 1.45)
//             return fail("El visitante genera poco ataque");

//         if (homeLambda > 1.10)
//             return fail("El local genera peligro");

//     }

//     return pass();

// }

// export function passBTTSGate(

//     home: TeamMetrics,

//     away: TeamMetrics,

//     prediction: ExtendedMatchPrediction,

//     volatility: number

// ): GateResult {


//     if (home.expectedGoals < 1.15)
//         return fail("Local con λ demasiado bajo");

//     if (away.expectedGoals < 1.15)
//         return fail("Visitante con λ demasiado bajo");

//     if (home.xGA < 1.0)
//         return fail("Local concede muy pocas ocasiones");

//     if (away.xGA < 1.0)
//         return fail("Visitante concede muy pocas ocasiones");

//     if (prediction.btts.yes.prob < 60)
//         return fail("Modelo BTTS insuficiente");

//     if (volatility > 0.45)
//         return fail("Partido demasiado volátil");


//     return pass();

// }

// export function passOver25Gate(

//     home: TeamMetrics,

//     away: TeamMetrics,

//     prediction: ExtendedMatchPrediction

// ): GateResult {


//     const totalLambda =
//         home.expectedGoals +
//         away.expectedGoals;


//     const over =
//         prediction.goalLines.find(
//             g => g.line === 2.5
//         );


//     if (!over)
//         return fail("No existe mercado");

//     if (totalLambda < 2.60)
//         return fail("Pocos goles esperados");

//     if (over.overProb < 58)
//         return fail("Probabilidad Over baja");

//     return pass();

// }

// export function passUnder25Gate(

//     home: TeamMetrics,

//     away: TeamMetrics,

//     prediction: ExtendedMatchPrediction

// ): GateResult {


//     const totalLambda =
//         home.expectedGoals +
//         away.expectedGoals;


//     const under =
//         prediction.goalLines.find(
//             g => g.line === 2.5
//         );


//     if (!under)
//         return fail("No existe mercado");

//     if (totalLambda > 2.20)
//         return fail("Muchos goles esperados");

//     if (under.underProb < 58)
//         return fail("Probabilidad Under baja");

//     return pass();

// }

// export function passDoubleChanceGate(

//     prediction: ExtendedMatchPrediction,

//     side: "1X" | "X2"

// ): GateResult {


//     const probability =
//         side === "1X"
//             ? prediction.doubleChance.homeOrDraw.prob
//             : prediction.doubleChance.drawOrAway.prob;


//     if (probability < 72)
//         return fail("Probabilidad insuficiente");


//     return pass();

// }

// export function passTeamGoalsGate(

//     team: TeamMetrics,

//     prediction: TeamGoalMarket[],

//     line: number

// ): GateResult {


//     const market =
//         prediction.find(
//             g => g.line === line
//         );


//     if (!market)
//         return fail("No existe línea");

//     if (team.expectedGoals < line + 0.60)
//         return fail("λ insuficiente");

//     if (market.overProb < 60)
//         return fail("Modelo insuficiente");


//     return pass();

// }

// export function passCleanSheetGate(

//     prediction: ExtendedMatchPrediction,

//     side: "home" | "away"

// ): GateResult {


//     const probability =
//         side === "home"
//             ? prediction.cleanSheet.home.prob
//             : prediction.cleanSheet.away.prob;


//     if (probability < 55)
//         return fail("Probabilidad insuficiente");


//     return pass();

// }

// export function passWinToNilGate(

//     prediction: ExtendedMatchPrediction,

//     side: "home" | "away"

// ): GateResult {


//     const probability =
//         side === "home"
//             ? prediction.winToNil.home.prob
//             : prediction.winToNil.away.prob;


//     if (probability < 35)
//         return fail("Probabilidad insuficiente");


//     return pass();

// }

// export function passResultBTTSGate(market: ProbabilityMarket): GateResult {

//     if (market.prob < 22)
//         return fail("Probabilidad demasiado baja");

//     return pass();
// }
import { ExtendedMatchPrediction } from '@/lib/predictions';
import { UnifiedTeamInfo } from '@/types/unifiedStats';
export interface GateResult {
    valid: boolean;
    reason?: string;
}

export function gateEngine(
    home: UnifiedTeamInfo,
    away: UnifiedTeamInfo,
    pred: ExtendedMatchPrediction
): GateResult {
    if (!home.metrics || !away.metrics) {
        return { valid: false, reason: 'Faltan métricas de uno de los equipos' };
    }
    if (!pred.moneyline || !pred.goalLines?.length) {
        return { valid: false, reason: 'Faltan datos de predicción básicos' };
    }
    // Validación rápida de valores
    const h = home.metrics;
    const a = away.metrics;
    if (h.xG < 0 || a.xG < 0 || h.xGA < 0 || a.xGA < 0) {
        return { valid: false, reason: 'xG o xGA negativos o inválidos' };
    }
    return { valid: true };
}