/**
 * Retorna apenas o nome legível da equipe, removendo o código INE (10 dígitos)
 * e os separadores adjacentes.
 *
 * Suporta qualquer formato que o eSUS PEC use:
 *   "0001234567 - ESF CENTRO"  →  "ESF CENTRO"
 *   "ESF CENTRO - 0001234567"  →  "ESF CENTRO"
 *   "ESF CENTRO"               →  "ESF CENTRO"
 */
export function equipeLabel(no_equipe) {
    if (!no_equipe) return '';
    return no_equipe
        .replace(/\d{10,}\s*[-–]\s*|\s*[-–]\s*\d{10,}/g, '')
        .trim();
}
