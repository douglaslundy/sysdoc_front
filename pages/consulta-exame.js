import React, { useState } from 'react';
import axios from 'axios';
import { Download, Loader2 } from 'lucide-react';
import { Banner } from '../src/components/ui/banner';
import { Button } from '../src/components/ui/button';
import { CampoTexto } from '../src/components/ui/campos';
import { Card, CardContent } from '../src/components/ui/card';
import { Pilula, tomDaCor } from '../src/components/ui/pilula';

const STATUS_COR = { normal: 'success', baixo: 'info', alto: 'error', critico: 'secondary', indefinido: 'default' };

export default function ConsultaExame() {
    const [form, setForm]             = useState({ protocolo: '', senha: '' });
    const [resultado, setResultado]   = useState(null);
    const [erro, setErro]             = useState('');
    const [loading, setLoading]       = useState(false);

    const change = ({ target: { name, value } }) =>
        setForm(f => ({ ...f, [name]: name === 'protocolo' ? value.toUpperCase() : value }));

    const handleConsultar = async () => {
        setErro('');
        setResultado(null);
        setLoading(true);
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/consulta-exame`, form);
            setResultado(res.data);
        } catch (e) {
            setErro(e?.response?.data?.error || 'Protocolo ou senha inválidos.');
        } finally {
            setLoading(false);
        }
    };

    const handleNova = () => {
        setResultado(null);
        setErro('');
        setForm({ protocolo: '', senha: '' });
    };

    const handleImprimirLaudo = async () => {
        try {
            const res = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/consulta-exame/pdf/${form.protocolo}`,
                { senha: form.senha },
                { responseType: 'blob' },
            );
            const url = URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = `laudo-${form.protocolo}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch {
            // erro silenciado — PDF pode não estar disponível
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
            <div className="w-full max-w-[680px]">
                <h1 className="mb-6 text-center text-3xl font-extrabold text-primary-text">
                    Consulta de Resultado de Exame
                </h1>

                {!resultado ? (
                    <Card>
                        <CardContent className="flex flex-col gap-4">
                            <CampoTexto
                                id="consulta-protocolo"
                                label="Protocolo"
                                name="protocolo"
                                value={form.protocolo}
                                onChange={change}
                                placeholder="LAB-XXXXXXXX"
                                maxLength={20}
                                className="uppercase tracking-widest"
                            />
                            <CampoTexto
                                id="consulta-senha"
                                label="Senha"
                                name="senha"
                                type="password"
                                value={form.senha}
                                onChange={change}
                                maxLength={6}
                            />
                            {erro && <Banner tom="perigo">{erro}</Banner>}
                            <Button size="lg" onClick={handleConsultar} disabled={loading || !form.protocolo || !form.senha}>
                                {loading ? <Loader2 className="animate-spin" /> : null}
                                {loading ? 'Consultando...' : 'Consultar'}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent>
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
                                <div>
                                    <h2 className="text-lg font-bold">{resultado.paciente?.nome}</h2>
                                    <span className="text-xs text-muted-foreground">
                                        Protocolo: {resultado.protocolo} &nbsp;|&nbsp;
                                        Válido até: {resultado.data_validade ? new Date(resultado.data_validade).toLocaleDateString('pt-BR') : '—'}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="success" size="sm" onClick={handleImprimirLaudo}>
                                        <Download /> Baixar Laudo PDF
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleNova}>Nova Consulta</Button>
                                </div>
                            </div>

                            {Object.entries(resultado.campos_por_exame || {}).map(([exameId, grupo]) => (
                                <section key={exameId} className="mb-6">
                                    <h3 className="mb-2 font-bold text-primary-text">{grupo.nome_exame}</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                                                    <th scope="col" className="px-3 py-2">Campo</th>
                                                    <th scope="col" className="px-3 py-2">Valor</th>
                                                    <th scope="col" className="px-3 py-2">Unidade</th>
                                                    <th scope="col" className="px-3 py-2 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(grupo.campos || []).map((rc, i) => (
                                                    <tr key={i} className="border-b border-border">
                                                        <td className="px-3 py-2">{rc.campo}</td>
                                                        <td className="px-3 py-2">{rc.valor_numerico ?? rc.valor_texto ?? '—'}</td>
                                                        <td className="px-3 py-2">{rc.unidade || '—'}</td>
                                                        <td className="px-3 py-2 text-center">
                                                            <Pilula tom={tomDaCor(STATUS_COR[rc.status_referencia])}>{rc.status_referencia}</Pilula>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
