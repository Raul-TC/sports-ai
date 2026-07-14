import { NextRequest, NextResponse } from "next/server";
import { parseExternalStats } from "@/lib/parseExternalStats";
import { calculateAllPredictions } from "@/lib/predictions";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const rawMatches = Array.isArray(body) ? body : body.data;

        if (!Array.isArray(rawMatches)) {
            return NextResponse.json(
                { error: "El JSON debe ser un arreglo de partidos (o { data: [...] })." },
                { status: 400 }
            );
        }

        // 1. Separar el JSON crudo en partidos individuales
        const matches = parseExternalStats(rawMatches, {
            filterKey: "ultimos5",
            statisticGroup: 2,
        });

        // 2. Calcular la predicción de cada partido por separado
        const predictions = calculateAllPredictions(matches, {
            goalLines: [1.5, 2.5, 3.5],
            cornerLines: [8.5, 9.5, 10.5],
            maxGoals: 8,
        });

        return NextResponse.json({ predictions });
    } catch (error) {
        console.error("Error procesando predicciones:", error);
        return NextResponse.json(
            { error: "No se pudo procesar el JSON. Revisa el formato." },
            { status: 500 }
        );
    }
}