import { calculateAllPredictions } from "@/lib/predictions";
import MatchesExplorer from "@/components/MatchesExplorer";
import data from '@/app/data/matches/mundial.json'
import { unifyMatchStats } from "@/lib/unifyMatchStats";
// Fuerza lectura fresca del filesystem en cada request — así si
// agregas/editas un .json en data/matches/, se refleja sin rebuild.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  // const rawMatches = await loadMatchesFromDisk();
  // const matches = computeAllMatches(data)
  const matches = unifyMatchStats(data)

  // const matches = parseExternalStats(rawMatches);

  const predictions = calculateAllPredictions(matches, {
    goalLines: [1.5, 2.5, 3.5],
    cornerLines: [6.5, 7.5, 8.5, 9.5, 10.5],
    maxGoals: 8,
  });

  // console.log()
  // console.log({ predictions })
  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <header className="flex items-center justify-between mb-10">
        <div className="w-full items-center justify-center">
          <h1 className="text-xl font-semibold tracking-tight text-center">Sports AI</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 text-center">
            Predicciones con modelo de Poisson
          </p>
        </div>
        {/* <ThemeToggle /> */}
      </header>

      {matches.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
          No hay partidos cargados. Agrega archivos <code>.json</code> a la carpeta{" "}
          <code>data/matches/</code> en la raíz del proyecto y recarga la página.
        </p>
      ) : (
        <MatchesExplorer predictions={predictions} />
      )}
    </main>
  );
}