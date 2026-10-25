import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Save } from 'lucide-react';
import AlertModal from '../../src/components/messagesModal';
import { getLabConfig, updateLabConfig } from '../../src/store/fetchActions/labConfig';
import { Button } from '../../src/components/ui/button';
import { CampoTexto } from '../../src/components/ui/campos';
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/ui/card';
import { Carregando } from '../../src/components/ui/carregando';
import { Interruptor } from '../../src/components/ui/interruptor';

const emptyForm = {
    nome_estabelecimento: '',
    razao_social: '',
    endereco_rua: '',
    endereco_numero: '',
    endereco_bairro: '',
    endereco_cep: '',
    telefone: '',
    cnpj: '',
    email_lab: '',
    rodape1: '',
    rodape2: '',
    email_habilitado: false,
    imprimir_rascunho_exame: false,
};

function Secao({ titulo, children }) {
    return (
        <section className="border-t border-border pt-5 first:border-t-0 first:pt-0">
            <h2 className="mb-3 text-lg font-bold">{titulo}</h2>
            {children}
        </section>
    );
}

export default function ConfiguracoesLaboratorio() {
    const dispatch = useDispatch();
    const { config, loading } = useSelector((state) => state.labConfig);

    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        dispatch(getLabConfig());
    }, []);

    useEffect(() => {
        if (config) {
            setForm({
                nome_estabelecimento: config.nome_estabelecimento ?? '',
                razao_social:         config.razao_social         ?? '',
                endereco_rua:         config.endereco_rua         ?? '',
                endereco_numero:      config.endereco_numero      ?? '',
                endereco_bairro:      config.endereco_bairro      ?? '',
                endereco_cep:         config.endereco_cep         ?? '',
                telefone:             config.telefone             ?? '',
                cnpj:                 config.cnpj                 ?? '',
                email_lab:            config.email_lab            ?? '',
                rodape1:              config.rodape1              ?? '',
                rodape2:              config.rodape2              ?? '',
                email_habilitado:     config.email_habilitado     ?? false,
                imprimir_rascunho_exame: config.imprimir_rascunho_exame ?? false,
            });
        }
    }, [config]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validate = () => {
        const errs = {};
        if (form.endereco_cep && form.endereco_cep.replace(/\D/g, '').length !== 8)
            errs.endereco_cep = 'CEP deve ter 8 dígitos';
        if (form.cnpj && form.cnpj.replace(/\D/g, '').length !== 14)
            errs.cnpj = 'CNPJ deve ter 14 dígitos';
        if (form.email_lab && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_lab))
            errs.email_lab = 'E-mail inválido';
        return errs;
    };

    const handleSave = () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        dispatch(updateLabConfig({
            ...form,
            endereco_cep: form.endereco_cep.replace(/\D/g, ''),
            cnpj:         form.cnpj.replace(/\D/g, ''),
        }));
    };

    if (loading && !config) {
        return <Carregando className="justify-center py-16" />;
    }

    const campo = (name, label, extra = {}) => (
        <CampoTexto id={`lab-${name}`} label={label} name={name} value={form[name]} onChange={handleChange} erro={errors[name] || undefined} {...extra} />
    );

    return (
        <div className="ui-reset">
            <AlertModal />
            <Card>
                <CardHeader><CardTitle>Configurações do Laboratório</CardTitle></CardHeader>
                <CardContent className="flex flex-col gap-5">
                    <Secao titulo="Dados do Estabelecimento">
                        <div className="grid gap-4 md:grid-cols-12">
                            <div className="md:col-span-6">{campo('nome_estabelecimento', 'Nome do Estabelecimento')}</div>
                            <div className="md:col-span-6">{campo('razao_social', 'Razão Social')}</div>
                            <div className="md:col-span-5">{campo('endereco_rua', 'Rua')}</div>
                            <div className="md:col-span-2">{campo('endereco_numero', 'Número')}</div>
                            <div className="md:col-span-3">{campo('endereco_bairro', 'Bairro')}</div>
                            <div className="md:col-span-2">{campo('endereco_cep', 'CEP', { maxLength: 9 })}</div>
                            <div className="md:col-span-3">{campo('telefone', 'Telefone')}</div>
                            <div className="md:col-span-4">{campo('cnpj', 'CNPJ', { maxLength: 18 })}</div>
                            <div className="md:col-span-5">{campo('email_lab', 'E-mail do Laboratório')}</div>
                        </div>
                    </Secao>

                    <Secao titulo="Rodapé do Laudo">
                        <div className="grid gap-4">
                            {campo('rodape1', 'Rodapé 1', { multiline: true, rows: 2, placeholder: 'Ex: Laboratório Participante do Programa Nacional de Controle de Qualidade - PNCQ/SBAC' })}
                            {campo('rodape2', 'Rodapé 2', { multiline: true, rows: 3, placeholder: 'Ex: *Os exames sofrem influência fisiopatológica...' })}
                        </div>
                    </Secao>

                    <Secao titulo="Notificações">
                        <div className="flex max-w-[480px] flex-col gap-3">
                            <div className="rounded-xl border border-border p-4">
                                <Interruptor
                                    id="lab-email-habilitado"
                                    marcado={form.email_habilitado}
                                    aoMudar={(marcado) => setForm((prev) => ({ ...prev, email_habilitado: marcado }))}
                                >
                                    <span>
                                        <span className="block">{form.email_habilitado ? 'E-mail habilitado' : 'E-mail desabilitado'}</span>
                                        <span className="block text-xs text-muted-foreground">
                                            Quando habilitado, envia e-mail ao paciente ao liberar resultado.
                                            Requer e-mail do paciente cadastrado.
                                        </span>
                                    </span>
                                </Interruptor>
                            </div>

                            <div className="rounded-xl border border-border p-4">
                                <Interruptor
                                    id="lab-rascunho"
                                    marcado={form.imprimir_rascunho_exame}
                                    aoMudar={(marcado) => setForm((prev) => ({ ...prev, imprimir_rascunho_exame: marcado }))}
                                >
                                    <span>
                                        <span className="block">{form.imprimir_rascunho_exame ? 'Imprimir rascunho habilitado' : 'Imprimir rascunho desabilitado'}</span>
                                        <span className="block text-xs text-muted-foreground">
                                            Permite baixar o rascunho do laudo antes da liberação final do resultado.
                                        </span>
                                    </span>
                                </Interruptor>
                            </div>
                        </div>
                    </Secao>

                    <div className="flex justify-end border-t border-border pt-5">
                        <Button disabled={loading} onClick={handleSave}>
                            <Save /> {loading ? 'Salvando...' : 'Salvar Configurações'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
