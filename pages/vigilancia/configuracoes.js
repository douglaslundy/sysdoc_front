import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Save, Trash2 } from 'lucide-react';
import ContatosWhatsapp from '../../src/components/vigilancia/ContatosWhatsapp';
import AlertModal from '../../src/components/messagesModal';
import { getVigilanciaConfig, updateVigilanciaConfig } from '../../src/store/fetchActions/vigilanciaConfig';
import { Button } from '../../src/components/ui/button';
import { CampoTexto } from '../../src/components/ui/campos';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import { Carregando } from '../../src/components/ui/carregando';
import CampoSecretariaObrigatorio, { useSecretariaObrigatoria } from '../../src/components/secretaria/CampoSecretariaObrigatorio';

const emptyForm = {
    estado: '',
    nome_municipio: '',
    nome_prefeitura: '',
    cnpj_prefeitura: '',
    nome_secretaria: '',
    cnpj_secretaria: '',
    divisao: '',
    endereco: '',
    cep: '',
    telefone: '',
    email: '',
    nome_responsavel: '',
    cargo_responsavel: '',
    grant_type: 'ALVARÁ SANITÁRIO DE FUNCIONAMENTO',
    observacoes: [],
};

function Secao({ titulo, children }) {
    return (
        <section className="border-t border-border pt-5 first:border-t-0 first:pt-0">
            <h2 className="mb-3 text-lg font-bold">{titulo}</h2>
            {children}
        </section>
    );
}

export default function ConfiguracoesVigilancia() {
    const dispatch = useDispatch();
    const { config, loading } = useSelector((state) => state.vigilanciaConfig);

    const [form, setForm]         = useState(emptyForm);
    const [novaObs, setNovaObs]   = useState('');
    const secretaria = useSecretariaObrigatoria();

    useEffect(() => {
        if (secretaria.pronta) dispatch(getVigilanciaConfig(secretaria.payload()));
    }, [secretaria.exigir, secretaria.valor]);

    useEffect(() => {
        if (config) {
            setForm({
                estado:           config.estado           ?? '',
                nome_municipio:   config.nome_municipio   ?? '',
                nome_prefeitura:  config.nome_prefeitura  ?? '',
                cnpj_prefeitura:  config.cnpj_prefeitura  ?? '',
                nome_secretaria:  config.nome_secretaria  ?? '',
                cnpj_secretaria:  config.cnpj_secretaria  ?? '',
                divisao:          config.divisao          ?? '',
                endereco:         config.endereco         ?? '',
                cep:              config.cep              ?? '',
                telefone:         config.telefone         ?? '',
                email:            config.email            ?? '',
                nome_responsavel: config.nome_responsavel ?? '',
                cargo_responsavel:config.cargo_responsavel?? '',
                grant_type:       config.grant_type       ?? 'ALVARÁ SANITÁRIO DE FUNCIONAMENTO',
                observacoes:      config.observacoes      ?? [],
            });
        }
    }, [config]);

    const change = ({ target: { name, value } }) =>
        setForm(f => ({ ...f, [name]: value }));

    const addObs = () => {
        const text = novaObs.trim();
        if (!text) return;
        setForm(f => ({ ...f, observacoes: [...(f.observacoes || []), text] }));
        setNovaObs('');
    };

    const removeObs = (idx) =>
        setForm(f => ({ ...f, observacoes: f.observacoes.filter((_, i) => i !== idx) }));

    const handleSave = () => {
        dispatch(updateVigilanciaConfig({
            ...form,
            cep:             form.cep.replace(/\D/g, ''),
            cnpj_prefeitura: form.cnpj_prefeitura.replace(/\D/g, ''),
            cnpj_secretaria: form.cnpj_secretaria.replace(/\D/g, ''),
        }, secretaria.payload()));
    };

    if (!secretaria.pronta) {
        return (
            <Card><CardContent className="max-w-sm pt-6"><CampoSecretariaObrigatorio controle={secretaria} id="vig-secretaria" /></CardContent></Card>
        );
    }

    if (loading && !config) {
        return <Carregando className="justify-center py-16" />;
    }

    const campo = (name, label, extra = {}) => (
        <CampoTexto id={`vig-${name}`} label={label} name={name} value={form[name]} onChange={change} {...extra} />
    );

    return (
        <div>
            <AlertModal />
            <Card>
                <CardHeader><CardTitle>Configurações da Vigilância Sanitária</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-5">
                    <div className="max-w-sm"><CampoSecretariaObrigatorio controle={secretaria} id="vig-secretaria" /></div>
                    <Secao titulo="Identificação Institucional">
                        <div className="grid gap-4 md:grid-cols-12">
                            <div className="md:col-span-2">{campo('estado', 'UF (Estado)', { maxLength: 2, className: 'uppercase' })}</div>
                            <div className="md:col-span-4">{campo('nome_municipio', 'Município')}</div>
                            <div className="md:col-span-6">{campo('nome_prefeitura', 'Nome da Prefeitura')}</div>
                            <div className="md:col-span-4">{campo('cnpj_prefeitura', 'CNPJ da Prefeitura', { maxLength: 18 })}</div>
                            <div className="md:col-span-8">{campo('nome_secretaria', 'Nome da Secretaria', { placeholder: 'Ex: Secretaria Municipal de Saúde' })}</div>
                            <div className="md:col-span-4">{campo('cnpj_secretaria', 'CNPJ da Secretaria', { maxLength: 18 })}</div>
                            <div className="md:col-span-8">{campo('divisao', 'Divisão', { placeholder: 'Ex: Divisão de Vigilância Sanitária' })}</div>
                        </div>
                    </Secao>

                    <Secao titulo="Endereço e Contato">
                        <div className="grid gap-4 md:grid-cols-12">
                            <div className="md:col-span-6">{campo('endereco', 'Endereço')}</div>
                            <div className="md:col-span-2">{campo('cep', 'CEP', { maxLength: 9 })}</div>
                            <div className="md:col-span-4">{campo('telefone', 'Telefone')}</div>
                            <div className="md:col-span-6">{campo('email', 'E-mail', { type: 'email' })}</div>
                        </div>
                    </Secao>

                    <Secao titulo="Responsável pela Vigilância">
                        <div className="grid gap-4 md:grid-cols-2">
                            {campo('nome_responsavel', 'Nome do Responsável')}
                            {campo('cargo_responsavel', 'Cargo', { placeholder: 'Ex: Coordenador de Vigilância Sanitária' })}
                        </div>
                    </Secao>

                    <Secao titulo="Tipo de Alvará">
                        <div className="max-w-2xl">
                            {campo('grant_type', 'Título do Alvará (grant_type)', { placeholder: 'Ex: ALVARÁ SANITÁRIO DE FUNCIONAMENTO' })}
                        </div>
                    </Secao>

                    <Secao titulo="Observações (aparecem no PDF do Alvará)">
                        <div className="mb-2 flex items-end gap-2">
                            <div className="flex-1">
                                <CampoTexto
                                    id="vig-nova-obs"
                                    label="Nova observação"
                                    value={novaObs}
                                    onChange={e => setNovaObs(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addObs()}
                                    maxLength={500}
                                />
                            </div>
                            <Button variant="outline" onClick={addObs} className="whitespace-nowrap">
                                Adicionar
                            </Button>
                        </div>
                        {form.observacoes && form.observacoes.length > 0 && (
                            <ul>
                                {form.observacoes.map((obs, i) => (
                                    <li key={i} className="flex items-center justify-between gap-2 border-b border-border py-1.5 text-sm">
                                        <span>{`${i + 1}. ${obs}`}</span>
                                        <Button variant="ghost" size="icon-sm" aria-label={`Remover observação ${i + 1}`} onClick={() => removeObs(i)}>
                                            <Trash2 className="text-danger-text" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Secao>

                    <div className="flex justify-end border-t border-border pt-5">
                        <Button disabled={loading} onClick={handleSave}>
                            <Save /> {loading ? 'Salvando...' : 'Salvar Configurações'}
                        </Button>
                    </div>

                    <div className="border-t border-border pt-5">
                        <ContatosWhatsapp />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
