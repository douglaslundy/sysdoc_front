import { Esqueleto } from '../ui/esqueleto';

export function DashboardLoading() {
    return (
        <div className="grid gap-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Esqueleto key={`metric-${index}`} className="h-[126px]" />
                ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                    <Esqueleto key={`chart-${index}`} className="h-80" />
                ))}
            </div>
        </div>
    );
}

export function getDashboardErrorMessage(modulo, erro) {
    const status = erro?.response?.status;
    const base = `Falha ao carregar o dashboard de ${modulo}.`;

    if (status === 401) return `${base} Sessao expirada. Faca login novamente.`;
    if (status === 403) return `${base} Você não tem permissão para este módulo.`;
    if (status === 429) return `${base} Muitas requisicoes em sequencia. Tente novamente em instantes.`;
    if (status >= 500) return `${base} Erro interno do servidor.`;
    if (status >= 400) return `${base} Requisicao invalida (${status}).`;

    return `${base} Dados indisponiveis no ambiente atual.`;
}

export function DashboardErro({ message = 'Dados indisponiveis.' }) {
    return (
        <div className="p-8 text-center">
            <p className="text-muted-foreground">{message}</p>
        </div>
    );
}
