import { Pick } from "@/types";

export function getOddsCategory(pick: Pick): "ratonera" | "media" | "alta" {
    const isML = pick.market === "Resultado";
    const limitMedia = isML ? 2.5 : 2.0;
    if (pick.odd <= 1.30) return "ratonera";
    if (pick.odd <= limitMedia) return "media";
    return "alta";
}