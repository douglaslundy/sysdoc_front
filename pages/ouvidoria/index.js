import React from 'react';
import Link from 'next/link';
import AuthCard from '../../src/components/auth/AuthCard';
import FormularioPublico from '../../src/components/ouvidoria/FormularioPublico';

const DESTAQUE = {
    titulo: 'Ouvidoria',
    texto: 'Registre reclamações, sugestões, elogios, denúncias e pedidos de informação.',
    beneficios: [
        'Você pode se identificar ou registrar de forma anônima.',
        'Acompanhe a resposta pelo protocolo e senha.',
        'A secretaria responde em até 30 dias.',
    ],
};

export default function OuvidoriaPublica() {
    return (
        <AuthCard
            titulo="Ouvidoria"
            descricao="Registre sua manifestação."
            destaque={DESTAQUE}
            rodape={
                <Link href="/ouvidoria/consulta">
                    <a className="text-sm text-primary-text underline-offset-4 hover:underline">Já registrei: acompanhar minha manifestação</a>
                </Link>
            }
        >
            <FormularioPublico />
        </AuthCard>
    );
}
