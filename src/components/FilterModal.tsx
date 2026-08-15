// components/FilterModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Filter, RotateCcw } from "lucide-react";

export interface FilterOptions {
    btts: "all" | "yes" | "no";
    overUnder: {
        line: 1.5 | 2.5 | 3.5 | null;
        type: "over" | "under" | null;
    };
    corners: {
        line: 8.5 | 9.5 | 10.5 | 11.5 | null;
        type: "over" | "under" | null;
    };
    result: "all" | "home" | "draw" | "away";
    confidence: "all" | "alta" | "media" | "baja";
    risk: "all" | "high" | "medium" | "low" | "none";
    minOdd: number;
    maxOdd: number;
}

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: FilterOptions;
    onApply: (filters: FilterOptions) => void;
    onReset: () => void;
    matches: any[]; // Partidos con scoredPicks
}

export function FilterModal({
    isOpen,
    onClose,
    filters,
    onApply,
    onReset,
    matches
}: FilterModalProps) {
    const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    if (!isOpen) return null;

    const handleChange = <K extends keyof FilterOptions>(
        key: K,
        value: FilterOptions[K]
    ) => {
        setLocalFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const handleReset = () => {
        onReset();
        onClose();
    };

    // Función para obtener el pick según el filtro activo
    const getMatchInfo = (match: any) => {
        const picks = match.scoredPicks || [];
        let selectedPick = null;

        // 1. BTTS (si el filtro está activo)
        if (localFilters.btts !== "all") {
            selectedPick = picks.find((p: any) => p.market === "BTTS");
        }

        // 2. Over/Under (si no se encontró BTTS o no es el filtro activo)
        if (!selectedPick && localFilters.overUnder.line !== null && localFilters.overUnder.type !== null) {
            const line = localFilters.overUnder.line;
            selectedPick = picks.find((p: any) => p.market === `Total de goles (${line})`);
        }

        // 3. Corners
        if (!selectedPick && localFilters.corners.line !== null && localFilters.corners.type !== null) {
            const line = localFilters.corners.line;
            const cornerPick = picks.find((p: any) => p.market === "Córners");
            if (cornerPick) {
                const sel = cornerPick.selection;
                const matchLine = parseFloat(sel.match(/[\d.]+/)?.[0] || "0");
                if (matchLine === line) {
                    selectedPick = cornerPick;
                }
            }
        }

        // 4. Resultado
        if (!selectedPick && localFilters.result !== "all") {
            selectedPick = picks.find((p: any) => p.market === "Resultado");
        }

        // 5. Si no hay filtro activo o no se encontró, tomar el mejor (score más alto)
        if (!selectedPick && picks.length > 0) {
            selectedPick = picks[0];
        }

        return {
            pick: selectedPick,
            odd: selectedPick?.odd || 0,
            market: selectedPick?.market || "N/A",
            selection: selectedPick?.selection || "N/A",
        };
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-neutral-700">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            Filtros avanzados
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body - Filtros */}
                <div className="px-6 py-4 space-y-4">
                    {/* BTTS */}
                    <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                            BTTS (Ambos anotan)
                        </label>
                        <div className="flex gap-2">
                            {(["all", "yes", "no"] as const).map((option) => (
                                <button
                                    key={option}
                                    onClick={() => handleChange("btts", option)}
                                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${localFilters.btts === option
                                        ? "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300"
                                        : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                                        }`}
                                >
                                    {option === "all" ? "Todos" : option === "yes" ? "Sí" : "No"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Goles Over/Under */}
                    <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                            Total de goles
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() =>
                                    handleChange("overUnder", { line: null, type: null })
                                }
                                className={`px-3 py-1 text-xs rounded-full border transition-colors ${localFilters.overUnder.line === null
                                    ? "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300"
                                    : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                                    }`}
                            >
                                Todos
                            </button>
                            {([1.5, 2.5, 3.5] as const).map((line) => (
                                <div key={line} className="flex items-center gap-0.5">
                                    <button
                                        onClick={() =>
                                            handleChange("overUnder", { line, type: "over" })
                                        }
                                        className={`px-2 py-1 text-xs rounded-l-full border transition-colors ${localFilters.overUnder.line === line &&
                                            localFilters.overUnder.type === "over"
                                            ? "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300"
                                            : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                                            }`}
                                    >
                                        Over {line}
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleChange("overUnder", { line, type: "under" })
                                        }
                                        className={`px-2 py-1 text-xs rounded-r-full border transition-colors ${localFilters.overUnder.line === line &&
                                            localFilters.overUnder.type === "under"
                                            ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300"
                                            : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                                            }`}
                                    >
                                        Under {line}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Corners */}
                    <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                            Córners
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() =>
                                    handleChange("corners", { line: null, type: null })
                                }
                                className={`px-3 py-1 text-xs rounded-full border transition-colors ${localFilters.corners.line === null
                                    ? "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300"
                                    : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                                    }`}
                            >
                                Todos
                            </button>
                            {([8.5, 9.5, 10.5, 11.5] as const).map((line) => (
                                <div key={line} className="flex items-center gap-0.5">
                                    <button
                                        onClick={() =>
                                            handleChange("corners", { line, type: "over" })
                                        }
                                        className={`px-2 py-1 text-xs rounded-l-full border transition-colors ${localFilters.corners.line === line &&
                                            localFilters.corners.type === "over"
                                            ? "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300"
                                            : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                                            }`}
                                    >
                                        Over {line}
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleChange("corners", { line, type: "under" })
                                        }
                                        className={`px-2 py-1 text-xs rounded-r-full border transition-colors ${localFilters.corners.line === line &&
                                            localFilters.corners.type === "under"
                                            ? "bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300"
                                            : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                                            }`}
                                    >
                                        Under {line}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resultado */}
                    <div>
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                            Resultado
                        </label>
                        <div className="flex gap-2">
                            {(["all", "home", "draw", "away"] as const).map((option) => (
                                <button
                                    key={option}
                                    onClick={() => handleChange("result", option)}
                                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${localFilters.result === option
                                        ? "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300"
                                        : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                                        }`}
                                >
                                    {option === "all"
                                        ? "Todos"
                                        : option === "home"
                                            ? "Local"
                                            : option === "draw"
                                                ? "Empate"
                                                : "Visitante"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Confianza y Riesgo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                                Confianza
                            </label>
                            <div className="flex flex-wrap gap-1">
                                {(["all", "alta", "media", "baja"] as const).map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => handleChange("confidence", option)}
                                        className={`px-2 py-1 text-xs rounded-full border transition-colors ${localFilters.confidence === option
                                            ? "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300"
                                            : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                                            }`}
                                    >
                                        {option === "all"
                                            ? "Todos"
                                            : option.charAt(0).toUpperCase() + option.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                                Riesgo
                            </label>
                            <div className="flex flex-wrap gap-1">
                                {(["all", "high", "medium", "low", "none"] as const).map(
                                    (option) => (
                                        <button
                                            key={option}
                                            onClick={() => handleChange("risk", option)}
                                            className={`px-2 py-1 text-xs rounded-full border transition-colors ${localFilters.risk === option
                                                ? "bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300"
                                                : "bg-gray-50 dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                                                }`}
                                        >
                                            {option === "all"
                                                ? "Todos"
                                                : option === "high"
                                                    ? "Alto"
                                                    : option === "medium"
                                                        ? "Medio"
                                                        : option === "low"
                                                            ? "Bajo"
                                                            : "Ninguno"}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Rango de cuota */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                                Cuota mínima
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="1.0"
                                max="10.0"
                                value={localFilters.minOdd}
                                onChange={(e) =>
                                    handleChange("minOdd", parseFloat(e.target.value) || 1.0)
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-neutral-700 rounded-md bg-gray-50 dark:bg-neutral-800 text-gray-800 dark:text-gray-100"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                                Cuota máxima
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="1.0"
                                max="10.0"
                                value={localFilters.maxOdd}
                                onChange={(e) =>
                                    handleChange("maxOdd", parseFloat(e.target.value) || 10.0)
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-neutral-700 rounded-md bg-gray-50 dark:bg-neutral-800 text-gray-800 dark:text-gray-100"
                            />
                        </div>
                    </div>
                </div>

                {/* Lista de partidos que cumplen los filtros */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Partidos que cumplen los filtros: {matches.length}
                        </h4>
                        <span className="text-xs text-gray-400">
                            Cuota mín: {localFilters.minOdd} · máx: {localFilters.maxOdd}
                        </span>
                    </div>

                    {matches.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                            No hay partidos que coincidan con los filtros seleccionados.
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {matches.map((match) => {
                                const info = getMatchInfo(match);
                                const bestPick = match.scoredPicks?.[0];
                                const confidence = bestPick?.confidence || "N/A";
                                return (
                                    <div
                                        key={match.matchUrl}
                                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-neutral-800 rounded-md border border-gray-200 dark:border-neutral-700"
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                                                {match.home.teamName} vs {match.away.teamName}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {info.market}
                                            </span>
                                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                                {info.selection}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                Momio: {info.odd.toFixed(2)}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                Conf: {confidence}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-end gap-3">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Resetear
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleApply}
                        className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
                    >
                        Aplicar filtros
                    </button>
                </div>
            </div>
        </div>
    );
}