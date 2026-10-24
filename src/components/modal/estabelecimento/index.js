import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { addEstabelecimentoFetch, editEstabelecimentoFetch } from '../../../store/fetchActions/estabelecimentos';
import { api } from '../../../services/api';
import { Button } from '../../ui/button';
import { Campo, CampoTexto } from '../../ui/campos';
import { ComboboxMultiplo } from '../../ui/combobox-multiplo';
import { Dialogo, DialogoCabecalho, DialogoRodape } from '../../ui/dialogo';

const EMPTY = {
    nome_responsavel: '',
    nome_estabelecimento: '',
    endereco: '',
    cnaes: [],
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    telefone: '',
    obs: '',
};

const maskCnaeInput = (raw) => {
    const digits = String(raw || '').replace(/\D/g, '').slice(0, 7);
    if (digits.length <= 4) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 5)}/${digits.slice(5)}`;
};

export default function EstabelecimentoDialog({ open, onClose, estabelecimento, onSuccess }) {
    const dispatch = useDispatch();
    const [form, setForm] = useState(EMPTY);
    const [cnaeOptions, setCnaeOptions] = useState([]);
    const [cnaeBusca, setCnaeBusca] = useState('');
    const [cnaeInputValue, setCnaeInputValue] = useState('');

    const selectedOptions = useMemo(
        () => (form.cnaes || []).map((codigo) => {
            const found = cnaeOptions.find((opt) => opt.codigo === codigo);
            return found || { codigo, descricao: '' };
        }),
        [form.cnaes, cnaeOptions]
    );

    useEffect(() => {
        if (!open) return;
        const load = async () => {
            const res = await api.get('/cnaes/select', { params: { busca: cnaeBusca || undefined } });
            setCnaeOptions(Array.isArray(res.data) ? res.data : []);
        };
        load();
    }, [open, cnaeBusca]);

    useEffect(() => {
        if (!open) return;
        setForm(estabelecimento
            ? {
                nome_responsavel: estabelecimento.nome_responsavel || '',
                nome_estabelecimento: estabelecimento.nome_estabelecimento || '',
                endereco: estabelecimento.endereco || '',
                cnaes: Array.isArray(estabelecimento.cnaes) ? estabelecimento.cnaes : [],
                razao_social: estabelecimento.razao_social || '',
                nome_fantasia: estabelecimento.nome_fantasia || '',
                cnpj: estabelecimento.cnpj || '',
                telefone: estabelecimento.telefone || '',
                obs: estabelecimento.obs || '',
            }
            : EMPTY);
        setCnaeBusca('');
        setCnaeInputValue('');
    }, [open, estabelecimento?.id]);

    const change = ({ target: { name, value } }) => setForm((f) => ({ ...f, [name]: value }));

    const handleSalvar = () => {
        const payload = { ...form, cnaes: form.cnaes || [] };
        if (estabelecimento?.id) {
            dispatch(editEstabelecimentoFetch(estabelecimento.id, payload, onSuccess));
        } else {
            dispatch(addEstabelecimentoFetch(payload, onSuccess));
        }
    };

    return (
        <Dialogo aberto={Boolean(open)} aoFechar={onClose} tamanho="lg">
            <DialogoCabecalho>{estabelecimento?.id ? 'Editar Estabelecimento' : 'Cadastrar Estabelecimento'}</DialogoCabecalho>
            <form
                className="space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSalvar();
                }}
            >
                <p className="text-xs font-semibold tracking-[0.07em] text-muted-foreground uppercase">Dados principais</p>
                <CampoTexto id="est-nome" label="Nome do Estabelecimento" name="nome_estabelecimento" value={form.nome_estabelecimento} onChange={change} obrigatorio required />
                <CampoTexto id="est-responsavel" label="Responsável" name="nome_responsavel" value={form.nome_responsavel} onChange={change} obrigatorio required />
                <CampoTexto id="est-endereco" label="Endereço" name="endereco" value={form.endereco} onChange={change} obrigatorio required />
                <Campo id="est-cnaes" label="CNAEs" obrigatorio dica="Selecione um ou mais CNAEs oficiais">
                    {(p) => (
                        <ComboboxMultiplo
                            id={p.id}
                            rotulo="CNAEs"
                            opcoes={cnaeOptions}
                            selecionadas={selectedOptions}
                            textoDigitado={cnaeInputValue}
                            aoDigitar={(valor) => {
                                const masked = maskCnaeInput(valor);
                                setCnaeInputValue(masked);
                                setCnaeBusca(masked);
                            }}
                            aoMudar={(valores) => {
                                setForm((f) => ({ ...f, cnaes: valores.map((v) => v.codigo) }));
                                setCnaeInputValue('');
                                setCnaeBusca('');
                            }}
                            chaveDaOpcao={(o) => o.codigo}
                            rotuloDaOpcao={(option) => `${option.codigo}${option.descricao ? ` - ${option.descricao}` : ''}`}
                        />
                    )}
                </Campo>

                <p className="pt-2 text-xs font-semibold tracking-[0.07em] text-muted-foreground uppercase">Dados complementares</p>
                <CampoTexto id="est-razao" label="Razão Social" name="razao_social" value={form.razao_social} onChange={change} />
                <CampoTexto id="est-fantasia" label="Nome Fantasia" name="nome_fantasia" value={form.nome_fantasia} onChange={change} />
                <CampoTexto id="est-cnpj" label="CNPJ" name="cnpj" value={form.cnpj} onChange={change} dica="Formato: 00.000.000/0000-00" />
                <CampoTexto id="est-telefone" label="Telefone" name="telefone" value={form.telefone} onChange={change} />
                <CampoTexto id="est-obs" label="Observações" name="obs" multiline rows={2} value={form.obs} onChange={change} />

                <DialogoRodape>
                    <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Gravar</Button>
                </DialogoRodape>
            </form>
        </Dialogo>
    );
}
