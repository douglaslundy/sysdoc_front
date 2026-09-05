// Fonte única de verdade para rotas públicas (sem sessão).
// Usado por `middleware.js` (gate real, Edge Runtime) E por `src/contexts/AuthContext.js`
// (estado de UI). Duplicar esta lista em dois lugares é como esse tipo de gate historicamente
// se desalinha — mantenha um só arquivo.
export const PUBLIC_PATHS = [
    '/login',
    '/consulta-exame',
    '/esqueci-senha',
    '/redefinir-senha',
    '/attendance/panel',
    '/transparency/medicines',
    '/transparency/medicines-panel',
    '/transparency/medicines-monthly-acquisitions',
];

export function isPublicPath(pathname) {
    return PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/showqueue');
}
