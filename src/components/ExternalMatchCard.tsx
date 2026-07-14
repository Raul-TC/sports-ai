// import { ExternalMatchStats } from "@/types/externalStats";

// interface ExternalMatchCardProps {
//     match: ExternalMatchStats;
//     isSelected: boolean;
//     onClick: () => void;
// }

// export default function ExternalMatchCard({ match, isSelected, onClick }: ExternalMatchCardProps) {
//     const matchTime = new Date(match.startTime).toLocaleString("es-MX", {
//         weekday: "short",
//         day: "numeric",
//         month: "short",
//         hour: "2-digit",
//         minute: "2-digit",
//     });

//     console.log({ match })
//     return (
//         <button
//             onClick={onClick}
//             className={`w-full text-left rounded-xl p-4 transition-all border ${isSelected
//                 ? "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"
//                 : "bg-transparent border-transparent hover:bg-white dark:hover:bg-neutral-900 hover:border-neutral-200 dark:hover:border-neutral-800"
//                 }`}
//         >
//             <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-2">
//                 {match.competitionName} · {matchTime}
//             </p>
//             <div className="flex items-center justify-between">
//                 <div className="flex flex-col">
//                     <span className="text-sm font-medium text-center">{match.home.teamName}</span>
//                     <div className="flex gap-2">

//                         <span>ML {match.prediction.moneyline.homeWin.prob}%</span>
//                         <span>Momio: {match.prediction.moneyline.homeWin.odd}</span>
//                     </div>
//                     <div className="flex flex-col">
//                         <span>Corners: {match.home.metrics.corners}</span>
//                         <span>Shots: {match.home.metrics.shots}</span>
//                         <span>ShotsOT: {match.home.metrics.shotsOT}</span>
//                         <span>Puntería: {match.home.metrics.shotFactor * 100}% de sus disparos van entre los tres palos.</span>
//                         <span>xG: {match.home.metrics.xG}</span>
//                         <span>xGA: {match.home.metrics.xGA}</span>
//                         <span>Efifiencia: {(match.home.metrics.efficiency * 100).toFixed(2)} % de sus disparos son gol</span>
//                         <span>Efifiencia Ofensiva: {match.home.metrics.offensiveEfficiency}</span>
//                         <span>Presicion Tiro: {match.home.metrics.precisionDrop}</span>
//                         <span>Goles Esperados: {match.home.metrics.expectedGoals}</span>
//                     </div>
//                 </div>
//                 <span className="text-xs text-neutral-300 dark:text-neutral-600 px-3">vs</span>
//                 <div className="flex flex-col">

//                     <span className="text-sm font-medium text-center">{match.away.teamName}</span>
//                     <div className="flex gap-2">

//                         <span>ML {match.prediction.moneyline.awayWin.prob}%</span>
//                         <span>Momio: {match.prediction.moneyline.awayWin.odd}</span>
//                     </div>
//                     <div className="flex flex-col">
//                         <span>Corners: {match.away.metrics.corners}</span>
//                         <span>Shots: {match.away.metrics.shots}</span>
//                         <span>ShotsOT: {match.away.metrics.shotsOT}</span>
//                         <span>xG: {match.away.metrics.xG}</span>
//                         <span>xGA: {match.away.metrics.xGA}</span>
//                         <span>Efifiencia Defensiva: {match.away.metrics.efficiency}</span>
//                         <span>Efifiencia Ataque: {match.away.metrics.offensiveEfficiency}</span>
//                         <span>Presicion Tiro: {match.away.metrics.precisionDrop}</span>
//                         <span>Goles Esperados: {match.away.metrics.expectedGoals}</span>
//                     </div>
//                 </div>
//             </div>
//         </button>
//     );
// }