import { calculateAllPredictions } from "@/lib/predictions";
import MatchesExplorer from "@/components/MatchesExplorer";
// import data from '@/app/data/matches/results_complete.json'
import data from '@/app/data/matches/results_complete.json'
import dataResults from '@/app/data/matches/results.json'
import { unifyMatchStats } from "@/lib/unifyMatchStats";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const matches = unifyMatchStats(data as any)
  const results = Array.isArray(dataResults) ? dataResults : [];



  const predictions = calculateAllPredictions(matches, {
    goalLines: [1.5, 2.5, 3.5, 4.5],
    cornerLines: [6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5],
    maxGoals: 10
  });

  // console.log({ matches })
  return (
    <main className="max-w-7xl mx-auto px-6 py-12">

      {matches.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          No hay partidos cargados. Agrega archivos <code>.json</code> a la carpeta{" "}
          <code>data/matches/</code> en la raíz del proyecto y recarga la página.
        </p>
      ) : (
        <MatchesExplorer predictions={predictions as any} results={results} />
      )}
    </main>
  );
}