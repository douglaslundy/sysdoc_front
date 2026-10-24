import { Button, buttonVariants } from '../../ui/button';

const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / (1024 ** idx);
    return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
};

function BotaoDeArquivo({ disabled, children, ...props }) {
    return (
        <label className={`${buttonVariants({ variant: 'outline', size: 'sm' })} cursor-pointer has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-primary/25 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
            {children}
            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="sr-only" disabled={disabled} {...props} />
        </label>
    );
}

/**
 * Anexos de ofício/portaria. Registro já salvo: lista com baixar/remover e envio imediato.
 * Registro novo: escolhe os arquivos agora, que sobem depois de gravar.
 */
export default function AnexosDoRegistro({ rotulo, salvo, anexos, carregando, enviando, pendentes, aoEnviar, aoEscolherPendentes, aoBaixar, aoRemover }) {
    return (
        <div className="mt-5 border-t border-border pt-4">
            <h3 className="mb-2 font-display text-sm font-bold">{`Anexos ${rotulo}`}</h3>
            {salvo ? (
                <>
                    <p className="mb-2 text-sm text-muted-foreground">Este registro aceita múltiplos anexos (PDF, JPG, JPEG e PNG).</p>
                    <BotaoDeArquivo disabled={enviando} onChange={aoEnviar}>{enviando ? 'Enviando...' : 'Enviar Anexo(s)'}</BotaoDeArquivo>
                    <div className="mt-3">
                        {carregando && <p className="text-sm text-muted-foreground">Carregando anexos...</p>}
                        {!carregando && anexos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum anexo enviado.</p>}
                        {!carregando && anexos.map((anexo) => (
                            <div key={anexo.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">{anexo.original_name}</p>
                                    <p className="text-xs text-muted-foreground">{anexo.mime_type} | {formatBytes(anexo.size_bytes)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => aoBaixar(anexo)}>Baixar</Button>
                                    <Button type="button" variant="destructive" size="sm" onClick={() => aoRemover(anexo)}>Remover</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    <p className="mb-2 text-sm text-muted-foreground">{`Selecione os anexos agora e clique em Gravar. O sistema salva ${rotulo === 'da Portaria' ? 'a portaria' : 'o ofício'} e envia os arquivos em seguida.`}</p>
                    <BotaoDeArquivo onChange={aoEscolherPendentes}>Selecionar Anexo(s) (PDF/JPG/PNG)</BotaoDeArquivo>
                    {pendentes.length > 0 && <p className="mt-2 text-xs text-muted-foreground">{pendentes.length} arquivo(s) pronto(s) para envio após salvar.</p>}
                </>
            )}
        </div>
    );
}
