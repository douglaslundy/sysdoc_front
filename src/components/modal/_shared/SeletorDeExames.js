import { useState } from 'react';
import { X } from 'lucide-react';
import { CaixaDeMarcacao } from '../../ui/caixa-de-marcacao';
import { CampoDeBusca } from '../../ui/campo-de-busca';

const rotuloCurto = (nome) => {
    const valor = nome || '—';
    return valor.length > 30 ? `${valor.slice(0, 27)}...` : valor;
};

/** Filtro + lista de exames com caixas de marcação + resumo dos selecionados (pedido novo e edição de pedido). */
export default function SeletorDeExames({ exames, selecionados, aoAlternar, desabilitado = false, idBase = 'exame' }) {
    const [busca, setBusca] = useState('');
    const termo = busca.toLowerCase();
    const filtrados = exames.filter((e) => e.nome?.toLowerCase().includes(termo) || e.codigo?.toLowerCase().includes(termo));

    return (
        <div className="grid gap-3">
            <CampoDeBusca
                rotulo="Filtrar exames"
                placeholder="Filtrar exames por nome ou código"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                disabled={desabilitado}
            />

            <div className="max-h-[220px] overflow-y-auto rounded-lg border border-border p-2">
                {filtrados.map((exame) => (
                    <CaixaDeMarcacao
                        key={exame.id}
                        id={`${idBase}-${exame.id}`}
                        marcado={selecionados.includes(exame.id)}
                        aoMudar={() => aoAlternar(exame.id)}
                        disabled={desabilitado}
                        className="items-start py-1.5"
                    >
                        <span>
                            <span className="block">{exame.nome}</span>
                            <span className="block text-xs text-muted-foreground">{exame.codigo}</span>
                        </span>
                    </CaixaDeMarcacao>
                ))}
                {filtrados.length === 0 && <p className="p-2 text-sm text-muted-foreground">Nenhum exame encontrado</p>}
            </div>

            {selecionados.length > 0 && (
                <div>
                    <p className="text-xs text-muted-foreground">{selecionados.length} exame(s) selecionado(s):</p>
                    <ul className="mt-1 flex flex-wrap gap-1.5">
                        {exames.filter((e) => selecionados.includes(e.id)).map((e) => (
                            <li key={e.id} title={e.codigo} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs">
                                {rotuloCurto(e.nome)}
                                {!desabilitado && (
                                    <button type="button" aria-label={`Remover ${e.nome}`} onClick={() => aoAlternar(e.id)} className="rounded text-muted-foreground hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none">
                                        <X className="size-3" aria-hidden />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
