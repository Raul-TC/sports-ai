import { calculateAllPredictions } from "@/lib/predictions";
import MatchesExplorer from "@/components/MatchesExplorer";
import data from '@/app/data/matches/mundial.json'
import dataTwo from '@/app/data/matches/results_complete.json'
import dataThree from '@/app/data/matches/results_completev2.json'
import dataFour from '@/app/data/matches/results_completev3.json'
import dataResults from '@/app/data/matches/results.json'
import { unifyMatchStats } from "@/lib/unifyMatchStats";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  function mergeUniqueMatches(...sources: any[][]): any[] {
    const seen = new Set<string>();
    const result: any[] = [];
    let total = 0;
    let duplicates = 0;

    for (const src of sources) {
      for (const m of src ?? []) {
        total++;
        // Clave de deduplicación: matchUrl (o id si no hay url)
        const key = m?.matchUrl ?? String(m?.id ?? m?.gameId ?? "");
        if (!key) {
          result.push(m);
          continue;
        }
        if (seen.has(key)) {
          duplicates++;
          continue;
        }
        seen.add(key);
        result.push(m);
      }
    }

    return result;
  }
  const rawMatches = mergeUniqueMatches(
    (data as any[]),
    (dataTwo as any[]),
    (dataThree as any[]),
    (dataFour as any[]),
  )
  const matches = unifyMatchStats(rawMatches as any)

  const results = Array.isArray(dataResults) ? dataResults : [];
  const predictions = calculateAllPredictions(matches, {
    goalLines: [1.5, 2.5, 3.5, 4.5],
    cornerLines: [6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5],
    maxGoals: 10
  });

  return (
    <main className="w-full max-w-7xl mx-auto py-12">

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