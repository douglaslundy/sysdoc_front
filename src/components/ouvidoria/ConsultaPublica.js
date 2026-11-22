import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Banner } from '../ui/banner';
import { Button } from '../ui/button';
import { CampoTexto } from '../ui/campos';
import { consultarOuvidoria } from '../../services/ouvidoria';
import { StatusOuvidoria } from './StatusOuvidoria';

const formatar = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR') : '');

export default function ConsultaPublica() {
    const router = useRouter();
    const [protocolo, setProtocolo] = useState('');
    const [senha, setSenha] = useState('');
    const [resultado, setResultado] = useState(null);
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);

    useEffect(() => {
        const q = router?.query?.protocolo;
        if (typeof q === 'string') setProtocolo(q.toUpperCase());
    }, [router?.query?.protocolo]);

    const consultar = async (event) => {
        event.preventDefault();
        setErro('');
        setResultado(null);
        setCarregando(true);
        try {
            setResultado(await consultarOuvidoria(protocolo.trim(), senha.trim()));
            setSenha('');
        } catch (err) {
            const status = err?.response?.status;
            if (status === 429) setErro('Muitas consultas. Aguarde um instante e tente novamente.');
            else if (status === 404) setErro('A ouvidoria online está indisponível no momento.');
            else setErro('Protocolo ou senha inválidos.');
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="space-y-4">
            <form onSubmit={consultar} className="space-y-4" autoComplete="off">
                {erro ? <Banner tom="perigo">{erro}</Banner> : null}
                <CampoTexto id="protocolo" label="Protocolo" obrigatorio required maxLength={30} value={protocolo} onChange={(e) => setProtocolo(e.target.value.toUpperCase())} />
                <CampoTexto id="senha" label="Senha" obrigatorio required maxLength={30} type="password" autoComplete="off" value={senha} onChange={(e) => setSenha(e.target.value)} />
                <Button type="submit" size="lg" className="w-full" disabled={carregando}>{carregando ? 'Consultando...' : 'Consultar'}</Button>
            </form>

            {resultado ? (
                <div className="space-y-3 rounded-lg border border-input p-4 text-sm" data-testid="resultado-consulta">
                    <div className="flex items-center justify-between gap-2">
                        <strong>{resultado.protocolo}</strong>
                        <StatusOuvidoria status={resultado.status} />
                    </div>
                    <p>{resultado.tipo_rotulo}: {resultado.assunto}</p>
                    <p className="text-xs text-muted-foreground">Registrada em {formatar(resultado.created_at)}</p>
                    {resultado.resposta ? (
                        <div className="rounded-lg bg-surface p-3">
                            <p className="mb-1 text-xs text-muted-foreground">Resposta{resultado.respondida_em ? ` em ${formatar(resultado.respondida_em)}` : ''}</p>
                            <p className="whitespace-pre-wrap">{resultado.resposta}</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Ainda não há resposta. Volte a consultar mais tarde.</p>
                    )}
                </div>
            ) : null}
        </div>
    );
}
