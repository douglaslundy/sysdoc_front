import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'lucide-react';
import TreatmentPlanPanel from './TreatmentPlanPanel';
import { api } from '../../services/api';
import { Button } from '../ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DataTable } from '../ui/data-table';
import { Dialogo, DialogoCabecalho } from '../ui/dialogo';

const formatDate = (isoDate) => {
    if (!isoDate) return '—';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
};

export default function TreatmentPlansAgenda() {
    const router = useRouter();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    const load = () => {
        setLoading(true);
        api.get('/queue-treatment-plans', { params: { status: 'active' } })
            .then((res) => setPlans(res.data || []))
            .catch(() => setPlans([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        load();
    }, []);

    const doneCount = (plan) => plan.sessions.filter((s) => s.status === 'done').length;

    const colunas = [
        { chave: 'paciente', titulo: 'Paciente', render: (p) => p.client_name },
        { chave: 'especialidade', titulo: 'Especialidade', render: (p) => p.speciality_name },
        { chave: 'progresso', titulo: 'Progresso', render: (p) => `${doneCount(p)} de ${p.total_sessions} sessões concluídas` },
        { chave: 'previsao', titulo: 'Previsão de término', render: (p) => formatDate(p.expected_end_at) },
    ];

    return (
        <Card className="ui-reset">
            <CardHeader>
                <CardTitle>Agenda de Tratamentos</CardTitle>
                <CardAction>
                    <Button variant="ghost" size="sm" onClick={() => router.push('/queue')}>
                        <ArrowLeft /> Voltar
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent>
                <DataTable
                    rotulo="Tratamentos ativos"
                    colunas={colunas}
                    linhas={plans}
                    chaveDaLinha={(p) => p.id}
                    carregando={loading}
                    vazio="Nenhum tratamento ativo no momento."
                    aoAbrir={setSelected}
                />
            </CardContent>

            <Dialogo aberto={Boolean(selected)} aoFechar={() => setSelected(null)} tamanho="lg">
                <DialogoCabecalho>{selected?.client_name} — {selected?.speciality_name}</DialogoCabecalho>
                {selected && (
                    <TreatmentPlanPanel
                        queueId={selected.queue_id}
                        speciality={{ id: selected.speciality_id, name: selected.speciality_name, allows_session_scheduling: true }}
                        onChanged={load}
                    />
                )}
            </Dialogo>
        </Card>
    );
}
