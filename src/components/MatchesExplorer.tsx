// app/MatchesExplorer.tsx (o donde tengas el componente)
"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { Trophy, Loader2 } from "lucide-react";
import { useMatchFilters } from "@/hooks/useMatchFilters";
import { TabNavigation } from "@/components/TabNavigation";
import { FilterOptions } from "@/components/FilterModal";
import type { PredictionResult as SharedPredictionResult } from "@/types/index";
import { MatchCard } from "./MatchCard";
import blacklist from "../app/data/matches/equiposBetados.json"
import TeamsLineStats from "./TeamsLineStats";
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
    cornersConceded: number;   // 🆕
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


export default function MatchesExplorer({ predictions, results }: MatchesExplorerProps) {
    const [selectedMatchUrl, setSelectedMatchUrl] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
    const { activeTab, setActiveTab, filteredPredictions, todayCount, futureCount, pastCount } = useMatchFilters(predictions, results);
    const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

    const toggleMatch = (url: string) => {
        setSelectedMatchUrl(selectedMatchUrl === url ? null : url);
    };

    const leagueNames = useMemo(() => {
        const names = new Set<string>();
        filteredPredictions.forEach(p => {
            if (p.competitionName) names.add(p.competitionName);
        });
        return Array.from(names).sort();
    }, [filteredPredictions]);
    const leagueFiltered = useMemo(() => {
        if (!selectedLeague) return filteredPredictions;
        return filteredPredictions.filter(p => p.competitionName === selectedLeague);
    }, [filteredPredictions, selectedLeague]);


    // ============================================================
    // VISIBLES
    // ============================================================


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
    const matches = leagueFiltered;

    // ============================================================
    // RENDER
    // ============================================================
    return (
        <div className="w-full mx-auto my-4">
            {/* Barra superior */}
            <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 tracking-tight flex items-center gap-2 mx-auto">
                    <Trophy className="w-6 h-6 text-indigo-500" />
                    Pronósticos de Partidos
                </h2>
            </div>

            <TeamsLineStats predictions={filteredPredictions} minMatches={10} />
            <div className="flex items-center gap-4 justify-between mb-2 border-b border-gray-200 dark:border-neutral-700">

                <TabNavigation
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    todayCount={todayCount}
                    futureCount={futureCount}
                    pastCount={pastCount}
                />
                {/* <PredictionsSummaryTable predictions={filteredPredictions} /> */}

                <div className="flex items-center gap-2 flex-wrap">
                    <select id="league-select"
                        value={selectedLeague || ''}
                        onChange={(e) => setSelectedLeague(e.target.value || null)}
                        className="bg-gray-50 dark:bg-neutral-800  dark:border-neutral-600 rounded-md px-3 py-1 text-sm cursor-pointer"
                    >
                        <option value="" className="block px-4 py-2 text-sm text-gray-300 cursor-pointer">Todas las ligas</option>

                        {leagueNames.map(name => (
                            <option className="block px-4 py-4 text-sm text-gray-300 cursor-pointer" key={name} value={name}>{name}</option>
                        ))}
                    </select>


                </div>
            </div>

            {
                filteredPredictions.length === 0 ? (
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
                            Mostrando {matches.length} de {leagueFiltered.length} partidos
                        </p>

                        {matches.map((r) => (
                            <MatchCard
                                key={r.matchUrl}
                                prediction={r}
                                activeTab={activeTab}
                                blackList={blacklist}
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
                )
            }

        </div >
    );
}