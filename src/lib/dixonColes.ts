// lib/models/dixonColes.ts

import { poisson } from "@/utils/poisson";

export interface DixonColesResult {
    scoreMatrix: number[][];
}

/**
 * Corrección τ de Dixon-Coles.
 *
 * x = goles local
 * y = goles visitante
 * λ = goles esperados local
 * μ = goles esperados visitante
 *
 * Paper:
 * Dixon & Coles (1997)
 */
function tau(
    x: number,
    y: number,
    lambda: number,
    mu: number,
    rho: number
): number {

    if (x === 0 && y === 0)
        return 1 - (lambda * mu * rho);

    if (x === 0 && y === 1)
        return 1 + (lambda * rho);

    if (x === 1 && y === 0)
        return 1 + (mu * rho);

    if (x === 1 && y === 1)
        return 1 - rho;

    return 1;
}

/**
 * Genera la matriz completa de probabilidades
 * utilizando Dixon-Coles.
 */
export function dixonColesProbabilities(
    homeLambda: number,
    awayLambda: number,
    maxGoals = 10,
    rho = -0.10
): DixonColesResult {

    const matrix: number[][] = [];

    let total = 0;

    for (let h = 0; h <= maxGoals; h++) {

        matrix[h] = [];

        for (let a = 0; a <= maxGoals; a++) {

            const homeProb = poisson(h, homeLambda);

            const awayProb = poisson(a, awayLambda);

            const correction = tau(
                h,
                a,
                homeLambda,
                awayLambda,
                rho
            );

            const probability =
                homeProb *
                awayProb *
                correction;

            matrix[h][a] = probability;

            total += probability;
        }
    }

    /**
     * Normalización.
     */

    for (let h = 0; h <= maxGoals; h++) {

        for (let a = 0; a <= maxGoals; a++) {

            matrix[h][a] /= total;
        }
    }

    return {
        scoreMatrix: matrix,
    };
}