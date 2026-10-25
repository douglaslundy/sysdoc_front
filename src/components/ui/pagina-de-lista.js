import { CabecalhoDePagina } from './cabecalho-de-pagina';
import { CampoDeBusca } from './campo-de-busca';
import { DataTable } from './data-table';
import { Paginacao } from './paginacao';

/**
 * Esqueleto das telas de lista: título, busca + ações, tabela e paginação.
 * `barra` entra ao lado da busca (botão "Novo", filtros); `children` recebe diálogos e gavetas da tela.
 */
export function PaginaDeLista({ titulo, subtitulo, busca, barra, colunas, linhas, chaveDaLinha, carregando, vazio, paginacao, rotuloDaTabela, aoAbrir, propsDaLinha, children }) {
  return (
    <div>
      <CabecalhoDePagina titulo={titulo} subtitulo={subtitulo} />
      {busca || barra ? (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {busca ? <CampoDeBusca {...busca} /> : null}
          {barra}
        </div>
      ) : null}
      <DataTable rotulo={rotuloDaTabela || titulo} colunas={colunas} linhas={linhas} chaveDaLinha={chaveDaLinha} carregando={carregando} vazio={vazio} aoAbrir={aoAbrir} propsDaLinha={propsDaLinha} />
      {paginacao ? <Paginacao {...paginacao} /> : null}
      {children}
    </div>
  );
}
