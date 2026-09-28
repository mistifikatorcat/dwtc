export function normalizeGuess(value: string): string {
    return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[-_.\/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}