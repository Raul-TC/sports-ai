import { HelpCircle } from "lucide-react";
import { useState } from "react";

export function HelpGlossary() {
    const [showHelp, setShowHelp] = useState(false);

    return (
        <>
            <button
                onClick={() => setShowHelp(!showHelp)}
                className="inline-flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline ml-auto"
            >
                <HelpCircle className="w-4 h-4" />
                ¿Qué significan estas estadísticas?
            </button>

            {showHelp && (
                <div className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-4 my-2 text-sm space-y-2">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Glosario de métricas</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div><strong>Gol Esp (xG):</strong> Goles esperados según ocasiones.</div>
                        <div><strong>Gol Esp Con (xGA):</strong> Goles esperados encajados.</div>
                        <div><strong>Tiros:</strong> Disparos totales.</div>
                        <div><strong>Tiro a Puerta:</strong> Disparos entre palos.</div>
                        <div><strong>Córners:</strong> Saques de esquina a favor.</div>
                        <div><strong>Eficiencia Of:</strong> Goles reales / xG. Indica si el equipo rinde más o menos de lo esperado.</div>
                        <div><strong>Goles Previstos:</strong> Predicción de goles (Poisson) para este partido.</div>
                        <div><strong>Puntería:</strong> Tiros a puerta / tiros totales. Alta = eficacia en el disparo.</div>
                        <div><strong>Eficiencia Bruta:</strong> Goles / tiros totales. Mide la conversión.</div>
                        <div><strong>Caída Precisión:</strong> Cambio en la puntería (histórico vs últimos 5 partidos).</div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Pasa el ratón o haz clic en cualquier badge para más detalles.</p>
                </div>
            )}
        </>
    );
}