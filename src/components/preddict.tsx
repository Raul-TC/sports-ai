"use client";

import { useState } from "react";
import { ExternalMatchStats } from "@/types/externalStats";
import { ExtendedMatchPrediction } from "@/lib/predictions";
import OddsPanel from "@/components/OddsPanel";

interface PredictionResult {
    matchUrl: string;
    home: ExternalMatchStats["home"];
    away: ExternalMatchStats["away"];
    prediction: ExtendedMatchPrediction;
}

export default function PrediccionesPage() {
    const [jsonInput, setJsonInput] = useState("");
    const [results, setResults] = useState<PredictionResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit() {
        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const parsedJson = JSON.parse(jsonInput);

            const res = await fetch("/api/predictions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(parsedJson),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error ?? "Error desconocido");

            setResults(data.predictions);
        } catch (err) {
            setError(
                err instanceof Error ? `Error: ${err.message}` : "El texto pegado no es un JSON válido."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="max-w-3xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-2">Predicciones por partido</h1>
            <p className="text-sm text-neutral-500 mb-4">
                Pega el JSON con el arreglo de partidos. Cada partido se procesa por separado.
            </p>

            <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Pega el JSON aquí..."
                className="w-full h-48 p-3 border border-neutral-300 dark:border-neutral-700 rounded-lg font-mono text-xs bg-white dark:bg-neutral-900 mb-3"
            />

            <button
                onClick={handleSubmit}
                disabled={loading || !jsonInput.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
                {loading ? "Calculando..." : "Calcular predicciones"}
            </button>

            {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

            <div className="mt-8 space-y-8">
                {results.map((r) => (
                    <div key={r.matchUrl}>
                        <h2 className="text-lg font-semibold mb-2">
                            {r.home.teamName} vs {r.away.teamName}
                        </h2>
                        <OddsPanel
                            prediction={r.prediction}
                            homeTeam={r.home.teamName}
                            awayTeam={r.away.teamName}
                        />
                    </div>
                ))}
            </div>
        </main>
    );
}