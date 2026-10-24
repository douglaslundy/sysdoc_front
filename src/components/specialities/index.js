import React, { useState, useEffect, useContext } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { parseISO, format } from "date-fns";

import SpecialityModal from "../modal/specialities";
import { AuthContext } from "../../contexts/AuthContext";
import { getAllSpecialities, inactiveSpecialityFetch } from "../../store/fetchActions/specialities";
import { showSpeciality } from "../../store/ducks/specialities";
import { changeTitleAlert, openSpecialitiesModal } from "../../store/ducks/Layout";
import ConfirmDialog from "../confirmDialog";
import AlertModal from "../messagesModal";
import { Button } from "../ui/button";
import { CampoDeBusca } from "../ui/campo-de-busca";
import { DataTable } from "../ui/data-table";
import { Paginacao } from "../ui/paginacao";
import { CabecalhoDePagina } from "../ui/cabecalho-de-pagina";

export default function Specialities() {
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "Deseja realmente excluir",
    subTitle: "Esta acao nao podera ser desfeita",
  });

  const dispatch = useDispatch();
  const { specialities } = useSelector((state) => state.specialities);
  const [searchValue, setSearchValue] = useState("");
  const [allSpecialities, setAllSpecialities] = useState(specialities);
  const { user, profile } = useContext(AuthContext);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(getAllSpecialities());
  }, []);

  useEffect(() => {
    setAllSpecialities(
      searchValue
        ? specialities.filter(
            (speciality) =>
              speciality.name && speciality.name.toString().toLowerCase().includes(searchValue.toString().toLowerCase())
          )
        : specialities
    );
    setPage(0);
  }, [specialities, searchValue]);

  const handleEditSpeciality = (speciality) => {
    dispatch(showSpeciality(speciality));
    dispatch(openSpecialitiesModal());
  };

  const handleInactiveSpeciality = (speciality) => {
    setConfirmDialog({
      ...confirmDialog,
      isOpen: true,
      title: `Deseja realmente excluir a sala ${speciality.name}`,
      confirm: inactiveSpecialityFetch(speciality),
    });
    dispatch(changeTitleAlert(`A especialidade ${speciality.name} foi excluida com sucesso!`));
  };

  const semPermissao = (speciality) => profile !== "admin" && speciality.id_user !== user;

  const colunas = [
    { chave: "id", titulo: "ID", numerica: true, render: (s) => s.id || "-" },
    { chave: "name", titulo: "Nome", render: (s) => <span className="font-semibold">{s.name ? s.name.substring(0, 50).toUpperCase() : "-"}</span> },
    { chave: "user", titulo: "Usuário cadastrador", render: (s) => s.user?.name || "-" },
    { chave: "created_at", titulo: "Criado em", render: (s) => (s.created_at ? format(parseISO(s.created_at), "dd/MM/yyyy HH:mm:ss") : "-") },
    {
      chave: "acoes",
      titulo: "Ações",
      render: (s) => (
        <div className="flex gap-2">
          <Button variant="success" size="icon-sm" title="Editar especialidade" aria-label="Editar especialidade" disabled={semPermissao(s)} onClick={() => handleEditSpeciality(s)}>
            <Pencil />
          </Button>
          <Button variant="destructive" size="icon-sm" title="Excluir especialidade" aria-label="Excluir especialidade" disabled={semPermissao(s)} onClick={() => handleInactiveSpeciality(s)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="ui-reset">
      <CabecalhoDePagina titulo="Especialidades" subtitulo={`Você possui ${allSpecialities.length} especialidades cadastradas`} />
      <AlertModal />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <CampoDeBusca rotulo="Pesquisar especialidade" placeholder="Pesquisar especialidade" name="search" maxLength={50} value={searchValue} onChange={({ target }) => setSearchValue(target.value || "")} />
        <SpecialityModal>
          <Button onClick={() => dispatch(openSpecialitiesModal())}>
            <Plus /> Nova especialidade
          </Button>
        </SpecialityModal>
      </div>

      <DataTable
        rotulo="Especialidades"
        colunas={colunas}
        linhas={allSpecialities.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)}
        chaveDaLinha={(s) => s.id}
        vazio="Nenhum registro encontrado!"
      />
      <Paginacao
        total={allSpecialities.length}
        pagina={page}
        porPagina={rowsPerPage}
        aoMudarPagina={setPage}
        aoMudarPorPagina={(n) => {
          setRowsPerPage(n);
          setPage(0);
        }}
      />

      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
    </div>
  );
}
