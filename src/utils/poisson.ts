function factorial(n: number): number {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

export function poisson(k: number, lambda: number): number {
    if (lambda === 0) return k === 0 ? 1 : 0;
    return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
}

export function getTopScoreProbabilities(
    homeLambda: number,
    awayLambda: number,
    maxGoals: number = 10,
    topN: number = 10
): { home: number; away: number; prob: number }[] {
    const scores: { home: number; away: number; prob: number }[] = [];
    for (let h = 0; h <= maxGoals; h++) {
        for (let a = 0; a <= maxGoals; a++) {
            const prob = poisson(h, homeLambda) * poisson(a, awayLambda);
            scores.push({ home: h, away: a, prob });
        }
    }
    scores.sort((a, b) => b.prob - a.prob);
    return scores.slice(0, topN);
}