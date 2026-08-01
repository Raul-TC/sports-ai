// types/engineTypes.ts
import { TeamInfo } from "@/types";
import { ExtendedMatchPrediction } from "@/lib/predictions";

export interface GateResult {
    valid: boolean;
    reason?: string;
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