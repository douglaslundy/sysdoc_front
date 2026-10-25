import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllCategorias, removeCategoriaFetch } from '../../../store/fetchActions/categoriasExame';
import { showCategoria } from '../../../store/ducks/categoriasExame';
import { openCategoriaExameModal } from '../../../store/ducks/Layout';
import CategoriaExameModal from '../../modal/categoriaExame';
import AlertModal from '../../messagesModal';
import { ActionCreateFab } from '../../actions';
import { AcoesDeLinha } from '../../ui/acoes-de-linha';
import { PaginaDeLista } from '../../ui/pagina-de-lista';
import { Pilula } from '../../ui/pilula';
import { usePaginacaoLocal } from '../../../lib/usePaginacaoLocal';

export default function CategoriasExame() {
    const dispatch = useDispatch();
    const { categorias } = useSelector(state => state.categoriasExame);

    const [busca, setBusca] = useState('');

    useEffect(() => {
        dispatch(getAllCategorias());
    }, []);

    const filtradas = categorias.filter(c =>
        c.nome?.toLowerCase().includes(busca.toLowerCase())
    );
    const { fatia, propsDaPaginacao } = usePaginacaoLocal(filtradas, 15);

    const handleNova = () => {
        dispatch(showCategoria({}));
        dispatch(openCategoriaExameModal());
    };

    const handleEditar = (categoria) => {
        dispatch(showCategoria(categoria));
        dispatch(openCategoriaExameModal());
    };

    const colunas = [
        { chave: 'nome', titulo: 'Nome', render: (categoria) => <span className="font-semibold">{categoria.nome}</span> },
        {
            chave: 'status',
            titulo: 'Status',
            render: (categoria) => <Pilula tom={categoria.ativo ? 'sucesso' : 'perigo'}>{categoria.ativo ? 'Ativa' : 'Inativa'}</Pilula>,
        },
        {
            chave: 'acoes',
            titulo: 'Ações',
            render: (categoria) => (
                <AcoesDeLinha
                    rotuloEditar="Editar categoria"
                    rotuloExcluir="Remover categoria"
                    aoEditar={() => handleEditar(categoria)}
                    aoExcluir={() => dispatch(removeCategoriaFetch(categoria.id))}
                />
            ),
        },
    ];

    return (
        <CategoriaExameModal>
            <PaginaDeLista
                titulo={`Você possui ${categorias.length} Categorias Cadastradas`}
                busca={{ rotulo: 'Buscar categoria', placeholder: 'Buscar categoria', value: busca, onChange: (e) => setBusca(e.target.value), maxLength: 80 }}
                barra={<ActionCreateFab title="Nova Categoria" onClick={handleNova} />}
                colunas={colunas}
                linhas={fatia}
                chaveDaLinha={(categoria) => categoria.id}
                vazio="Nenhuma categoria encontrada"
                rotuloDaTabela="categorias"
                paginacao={{ ...propsDaPaginacao, opcoes: [10, 15, 25] }}
            >
                <AlertModal />
            </PaginaDeLista>
        </CategoriaExameModal>
    );
}
