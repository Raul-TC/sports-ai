// types/engineTypes.ts
import { TeamInfo } from "@/types";
import { ExtendedMatchPrediction } from "@/lib/predictions";

export interface GateResult {
    valid: boolean;
    reason?: string;
}

// types/engineTypes.ts

export interface ParlayPick {
    matchUrl: string;
    homeTeam: string;
    awayTeam: string;
    market: string;           // "Resultado", "Total de goles", "BTTS", etc.
    selection: string;        // "Over 2.5", "Real Madrid", etc.
    odd: number;              // cuota decimal
    probability: number;      // probabilidad estimada (0-1)
    score: number;            // score del pick (0-100)
    confidence: 'alta' | 'media' | 'baja';
    reason: string;           // por qué es bueno este pick
}

// types/engineTypes.ts
export interface ParlayCandidate {
    pick: ScoreResult;
    matchUrl: string;
    homeTeam: string;
    awayTeam: string;
}

export interface Parlay {
    id: string;
    picks: ParlayPick[];
    totalOdd: number;
    totalEV: number;          // Expected Value combinado
    estimatedWinRate: number; // probabilidad de que acierten todos (producto de probs)
    riskLevel: 'low' | 'medium' | 'high';
    reasoning: string;        // explicación de por qué esta combinación tiene sentido
    score: number;            // puntuación global del parlay (0-100)
}

export interface ParlayEngineResult {
    parlays: Parlay[];
    topParlay: Parlay | null;
    totalCombinations: number;
}
export interface ScoreResult {
    market: string;
    selection: string;
    score: number;
    confidence: 'alta' | 'media' | 'baja';
    reason: string;
    recommendation: { betOn: string; avoid: string };
    warning?: string;
    // Opcional: datos adicionales para depuración
    metadata?: Record<string, any>;
    odd: number; // odd calculada a partir de la probabilidad base
}

export interface ConfidenceResult {
    level: 'alta' | 'media' | 'baja';
    score: number;
    calibratedProb?: number;
}

// types/engineTypes.ts
export interface TrapDetail {
    team: string;          // 'ambos' o nombre del equipo
    reason: string;        // Título corto (ej. "Sobrerendimiento ofensivo")
    explanation: string;   // Texto completo con implicaciones
    severity: 'low' | 'medium' | 'high';
}

export interface TrapResult {
    isTrap: boolean;
    level: 'low' | 'medium' | 'high' | 'none';
    details: TrapDetail[];
}

export interface Recommendation {
    pick: ScoreResult;
    trap: TrapResult;
    confidence: ConfidenceResult;
    reasoning: string;
    alternatives: ScoreResult[];
}

export interface ScoreEngineContext {
    home: TeamInfo;
    away: TeamInfo;
    pred: ExtendedMatchPrediction;
    volatility?: number;
    historicalMapping?: Map<number, number>; // para calibración
}