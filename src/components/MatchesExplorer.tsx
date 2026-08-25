// app/MatchesExplorer.tsx (o donde tengas el componente)
"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Trophy, HelpCircle, Loader2, Filter } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import { useMatchFilters } from "@/hooks/useMatchFilters";
import { TabNavigation } from "@/components/TabNavigation";
import { FilterModal, FilterOptions } from "@/components/FilterModal";
import { scoreEngine } from "@/utils/scoringEngine";
import { trapEngine } from "@/utils/trapEngine";
import type { PredictionResult as SharedPredictionResult } from "@/types/index";

// ============================================================
// INTERFACES
// ============================================================

interface TeamMetrics {
    golesPerPartido: number;
    golesRecibidos: number,
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

interface MatchesExplorerProps {
    predictions: SharedPredictionResult[];
    results: any[];
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const INITIAL_VISIBLE = 10;
const LOAD_MORE = 10;

const defaultFilters: FilterOptions = {
    btts: "all",
    overUnder: { line: null, type: null },
    corners: { line: null, type: null },
    result: "all",
    confidence: "all",
    risk: "all",
    minOdd: 1.0,
    maxOdd: 10.0,
};
const LEAGUES = {
    "LigaMX": { id: 141, name: "Liga MX", flag: "🇲🇽" },
    "Brasileirão": { id: 113, name: "Brasileirão", flag: "🇧🇷" },
    "MLS": { id: 104, name: "MLS", flag: "🇺🇸" },
    "Argentina": { id: 72, name: "Liga Profesional", flag: "🇦🇷" },
    "LaLiga": { id: 11, name: "LaLiga", flag: "🇪🇸" },
    "Premier League": { id: 168, name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
    "UEFA Champions League": { id: 332, name: "UEFA Champions League", flag: "🏆" },
    "Conmebol Libertadores": { id: 102, name: "Conmebol Libertadores", flag: "🏆" },
    "Conmebol Sudamericana": { id: 389, name: "Conmebol Sudamericana", flag: "🏆" },
};

export default function MatchesExplorer({ predictions, results }: MatchesExplorerProps) {
    const [selectedMatchUrl, setSelectedMatchUrl] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
    const { activeTab, setActiveTab, filteredPredictions, todayCount, futureCount, pastCount } = useMatchFilters(predictions, results);

    const toggleMatch = (url: string) => {
        setSelectedMatchUrl(selectedMatchUrl === url ? null : url);
    };
    // ============================================================
    // FETCH DE DATOS DE 365SCORES
    // ============================================================
    // async function fetchMatchData(id: number) {
    //     const res = await fetch(`https://webws.365scores.com/web/games/results/?appTypeId=5&langId=14&timezoneName=America%2FMexico_City&competitors=${id}`);
    //     return res.json();
    // }

    // ============================================================
    // VISIBLES
    // ============================================================
    const visiblePredictions = useMemo(() => {
        return filteredPredictions.slice(0, visibleCount);
    }, [filteredPredictions, visibleCount]);

    // ============================================================
    // FUNCIÓN DE FILTRADO CENTRALIZADA
    // ============================================================


    // ============================================================
    // LAZY LOADING
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
    // LISTA DE PARTIDOS FILTRADA CON PICKS PARA EL MODAL
    // ============================================================


    // Lista para renderizar (sin los picks, solo los datos del partido)
    const matches = visiblePredictions;

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="w-full mx-auto px-4 my-4">
            {/* Barra superior */}
            <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2 mx-auto">
                    <Trophy className="w-6 h-6 text-indigo-500" />
                    Estadísticas de Partidos
                </h2>
            </div>

            <TabNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                todayCount={todayCount}
                futureCount={futureCount}
                pastCount={pastCount}
            />

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
                        Mostrando {matches.length} de {visiblePredictions.length} partidos
                    </p>

                    {matches.map((r) => (
                        <MatchCard
                            key={r.matchUrl}
                            prediction={r}
                            onToggle={toggleMatch}
                            isSelected={selectedMatchUrl === r.matchUrl}
                            activeTab={activeTab}
                        />
                    ))}

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