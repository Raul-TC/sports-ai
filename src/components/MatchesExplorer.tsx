"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { ExtendedMatchPrediction } from "@/lib/predictions";
import { Trophy, HelpCircle, Loader2 } from "lucide-react";
import { MatchCard } from "./MatchCard";
import { useMatchFilters } from "@/hooks/useMatchFilters";
import { TabNavigation } from "./TabNavigation";
import { ParlayCandidate, ParlayEngineResult, ScoreResult } from "@/types/engineTypes";
import { scoreEngine } from "@/utils/scoringEngine";
import { parlayEngine } from "@/utils/parlayEngine";
import { ParlayCard } from "./ParlayCard";

// ============================================================
// INTERFACES
// ============================================================

interface TeamMetrics {
    golesPerPartido: number;
    xG: number;
    xGA: number;
    expectedGoals: number;
    shotFactor: number;
    offensiveEfficiency: number;
    efficiency: number;
    precisionDrop: number;
    corners: number;
    shots: number;
    shotsOT: number;
}

interface TeamInfo {
    teamId: number;
    id: number;
    teamName: string;
    metrics?: TeamMetrics;
}

interface PredictionResult {
    matchUrl: string;
    competitionName: string;
    startTime: string;
    home: TeamInfo;
    away: TeamInfo;
    prediction: ExtendedMatchPrediction;
    volatility?: number;
}

interface MatchesExplorerProps {
    predictions: PredictionResult[];
    results: any[]; // array de objetos con matchUrl y stats
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const INITIAL_VISIBLE = 10;
const LOAD_MORE = 10;

export default function MatchesExplorer({ predictions, results }: MatchesExplorerProps) {
    const [showHelp, setShowHelp] = useState(false);
    const [selectedMatchUrl, setSelectedMatchUrl] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
    const { activeTab, setActiveTab, filteredPredictions, todayCount, futureCount, pastCount } = useMatchFilters(predictions, results);
    const [matchesWithData, setMatchesWithData] = useState<any[]>([]);

    const visiblePredictions = useMemo(() => {
        return filteredPredictions.slice(0, visibleCount);
    }, [filteredPredictions, visibleCount]);

    const toggleMatch = (url: string) => {
        setSelectedMatchUrl(selectedMatchUrl === url ? null : url);
    };

    // ============================================================
    // FETCH DE DATOS DE 365SCORES PARA ÚLTIMOS PARTIDOS
    // ============================================================
    async function fetchMatchData(id: number) {
        const res = await fetch(`https://webws.365scores.com/web/games/results/?appTypeId=5&langId=14&timezoneName=America%2FMexico_City&competitors=${id}`);
        return res.json();
    }

    useEffect(() => {
        if (activeTab !== "today" && activeTab !== "future") return;

        const pending = visiblePredictions.filter(
            match => !matchesWithData.some(m => m.matchUrl === match.matchUrl)
        );

        if (pending.length === 0) return;

        const loadData = async () => {
            const data = await Promise.all(
                pending.map(async (match) => {
                    const result = await fetchMatchData(match.home.teamId);
                    const result2 = await fetchMatchData(match.away.teamId);
                    return {
                        ...match,
                        data: [result, result2],
                    };
                })
            );
            setMatchesWithData(prev => [...prev, ...data]);
        };

        loadData();
    }, [activeTab, visiblePredictions, matchesWithData]);

    // ============================================================
    // LAZY LOADING (SCROLL INFINITO)
    // ============================================================
    const hasMore = visibleCount < filteredPredictions.length;
    const loaderRef = useRef<HTMLDivElement>(null);

    const loadMore = useCallback(() => {
        if (hasMore) {
            setVisibleCount(prev => Math.min(prev + LOAD_MORE, filteredPredictions.length));
        }
    }, [hasMore, filteredPredictions.length]);

    useEffect(() => {
        const loader = loaderRef.current;
        if (!loader || !hasMore) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    loadMore();
                }
            },
            { root: null, rootMargin: "900px", threshold: 0 }
        );

        observer.observe(loader);
        return () => {
            observer.unobserve(loader);
        };
    }, [loaderRef.current, hasMore, loadMore]);

    useEffect(() => {
        setVisibleCount(INITIAL_VISIBLE);
    }, [activeTab, predictions]);

    // ============================================================
    // RENDER
    // ============================================================
    const matches = (activeTab === 'today' || activeTab === 'future') && matchesWithData.length > 0 ? matchesWithData : visiblePredictions;

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-indigo-500" />
                    Pronósticos de Partidos
                </h2>
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline ml-auto"
                >
                    <HelpCircle className="w-4 h-4" />
                    ¿Qué significan estas estadísticas?
                </button>
            </div>

            {showHelp && (
                <div className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-4 my-2 text-sm space-y-2">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Glosario de métricas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><strong>Gol Esp (xG):</strong> Goles esperados según ocasiones.</div>
                        <div><strong>Gol Esp Con (xGA):</strong> Goles esperados encajados.</div>
                        <div><strong>Tiros:</strong> Disparos totales.</div>
                        <div><strong>Tiro a Puerta:</strong> Disparos entre palos.</div>
                        <div><strong>Córners:</strong> Saques de esquina a favor.</div>
                        <div><strong>Eficiencia Of:</strong> Indica si el equipo rinde más o menos de lo esperado.</div>
                        <div><strong>Goles Previstos:</strong> Predicción de goles (Poisson) para este partido.</div>
                        <div><strong>Puntería:</strong> Alta = eficacia en el disparo.</div>
                        <div><strong>Eficiencia Bruta:</strong> Mide la conversión.</div>
                        <div><strong>Caída Precisión:</strong> Cambio en la puntería (histórico vs últimos 5 partidos).</div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Pasa el ratón o haz clic en cualquier badge para más detalles.</p>
                </div>
            )}

            {/* Pestañas */}
            <TabNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                todayCount={todayCount}
                futureCount={futureCount}
                pastCount={pastCount}
            />

            {/* Lista de partidos */}
            {filteredPredictions.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                    {activeTab === "today"
                        ? "No hay partidos programados para hoy."
                        : activeTab === "future"
                            ? "No hay partidos futuros."
                            : "No hay partidos pasados."}
                </div>
            ) : (
                <>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                        Mostrando {visiblePredictions.length} de {filteredPredictions.length} partidos
                    </p>

                    {matches.map((r) => {
                        // console.log("Renderizando MatchCard para:", r.matchUrl);
                        return <MatchCard
                            key={r.matchUrl
                            }
                            prediction={r}
                            onToggle={toggleMatch}
                            isSelected={selectedMatchUrl === r.matchUrl}
                            activeTab={activeTab}
                        />
                    }


                    )}

                    <div ref={loaderRef} className="py-4 flex justify-center items-center">
                        {hasMore ? (
                            <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cargando más partidos...
                            </div>
                        ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500">
                                ✅ Todos los partidos cargados
                            </span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}