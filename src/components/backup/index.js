import React, { useState } from 'react';
import { Database, Download, Loader2 } from 'lucide-react';
import { downloadBackup } from '../../store/fetchActions/backup';
import { Banner } from '../ui/banner';
import { Button } from '../ui/button';
import { CabecalhoDePagina } from '../ui/cabecalho-de-pagina';

export default function Backup() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await downloadBackup()();
            setSuccess(true);
        } catch (err) {
            const status = err?.status;
            if (status === 403) {
                setError('Acesso negado. Somente administradores podem fazer backup.');
            } else if (status === 401) {
                setError('Sessão expirada. Faça login novamente.');
            } else if (status === 500) {
                setError(`Erro interno no servidor ao gerar backup. Verifique os logs do backend.`);
            } else if (!status) {
                setError('Sem resposta do servidor. Verifique a conexão com a API.');
            } else {
                setError(`Erro ${status} ao gerar backup. Tente novamente.`);
            }
            console.error('[Backup] Erro:', status, err?.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <CabecalhoDePagina titulo="Backup do Banco de Dados" />
            <div className="flex max-w-[560px] flex-col gap-6">
                <div className="flex items-start gap-4">
                    <Database className="size-8 shrink-0 text-primary" aria-hidden />
                    <div>
                        <h2 className="font-display text-base font-bold">Exportar dump SQL completo</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Gera um arquivo <strong>.sql</strong> com a estrutura e os dados de todas as
                            tabelas do banco Sysdoc (MySQL, charset utf8mb4). O arquivo pode ser
                            importado diretamente em qualquer servidor MySQL compatível.
                        </p>
                    </div>
                </div>

                <Banner tom="alerta">
                    Recomendado realizar o backup antes de atualizações ou manutenções.
                    O download pode levar alguns instantes dependendo do tamanho do banco.
                </Banner>

                {error && <Banner tom="perigo" onDispensar={() => setError(null)}>{error}</Banner>}
                {success && <Banner tom="sucesso" onDispensar={() => setSuccess(false)}>Backup gerado com sucesso. Verifique sua pasta de downloads.</Banner>}

                <div>
                    <Button type="button" disabled={loading} onClick={handleDownload}>
                        {loading ? <Loader2 className="animate-spin" aria-hidden /> : <Download aria-hidden />}
                        {loading ? 'Gerando backup...' : 'Fazer Backup'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
