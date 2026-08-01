export function getConfidenceLevel(score: number): 'alta' | 'media' | 'baja' {
    if (score >= 70) return 'alta';
    if (score >= 45) return 'media';
    return 'baja';
}

export function calculateDefensiveEfficiency(goalsConceded: number, xGA: number): number {
    if (xGA === 0) return 1;
    return Math.min(Math.max(goalsConceded / xGA, 0.3), 1.7);
}

export function normalize(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
}