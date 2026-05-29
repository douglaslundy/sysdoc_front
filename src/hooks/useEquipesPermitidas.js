import { useEffect, useState } from 'react';
import { monitorApsApi } from '../services/monitorApsApi';

/**
 * Retorna as equipes que o usuário logado pode visualizar no Monitor APS.
 *
 * - isRt: true se o usuário é RT de equipe PSF
 * - allTeams: true se RT mas com acesso a todas as equipes
 * - isRestrito: true = deve usar `equipes` diretamente; false = buscar de /config/equipes
 * - equipes: array [{nu_ine, no_equipe}] — preenchido apenas quando isRestrito=true
 * - loading: true enquanto aguarda a resposta
 */
export function useEquipesPermitidas() {
    const [state, setState] = useState({
        isRt: false,
        allTeams: false,
        isRestrito: false,
        equipes: [],
        loading: true,
    });

    useEffect(() => {
        const ctrl = new AbortController();
        monitorApsApi.get('/minhas-equipes', { signal: ctrl.signal })
            .then(d => {
                const isRt      = Boolean(d.is_rt);
                const allTeams  = Boolean(d.all_teams);
                const isRestrito = isRt && !allTeams;
                setState({
                    isRt,
                    allTeams,
                    isRestrito,
                    equipes: d.equipes ?? [],
                    loading: false,
                });
            })
            .catch(() => setState(s => ({ ...s, loading: false })));
        return () => ctrl.abort();
    }, []);

    return state;
}
