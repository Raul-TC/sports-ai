import { readdir, readFile } from "fs/promises";
import path from "path";

const MATCHES_DIR = path.join(process.cwd(), "data", "matches");

/**
 * Lee todos los archivos .json dentro de data/matches/, los parsea, y
 * combina su contenido en un solo arreglo. Cada archivo puede contener
 * un solo partido (objeto) o un arreglo de partidos — ambos casos se
 * aplanan al mismo arreglo final.
 */
export async function loadMatchesFromDisk(): Promise<unknown[]> {
    let fileNames: string[];

    try {
        fileNames = await readdir(MATCHES_DIR);
    } catch {
        console.warn(`⚠️ No existe la carpeta ${MATCHES_DIR} — créala y agrega tus archivos .json`);
        return [];
    }

    const jsonFiles = fileNames.filter((name) => name.endsWith(".json"));

    if (jsonFiles.length === 0) {
        console.warn(`⚠️ No hay archivos .json en ${MATCHES_DIR}`);
        return [];
    }

    const combined: unknown[] = [];

    for (const fileName of jsonFiles) {
        try {
            const filePath = path.join(MATCHES_DIR, fileName);
            const raw = await readFile(filePath, "utf-8");
            const parsed = JSON.parse(raw);

            if (Array.isArray(parsed)) {
                combined.push(...parsed);
            } else {
                combined.push(parsed);
            }
        } catch (error) {
            console.error(`Error leyendo ${fileName}:`, error);
            // Continúa con los demás archivos aunque uno falle
        }
    }

    return combined;
}