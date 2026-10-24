import React, { useState, useEffect, useContext, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import Router from "next/router";
import { getAllUsers, inactiveUserFetch } from "../../store/fetchActions/user";
import { showUser } from "../../store/ducks/users";
import { changeTitleAlert, turnUserModal } from "../../store/ducks/Layout";
import { AuthContext } from "../../contexts/AuthContext";
import ConfirmDialog from "../confirmDialog";
import AlertModal from "../messagesModal";
import { ActionCreateFab, ActionDeleteButton, ActionEditButton } from "../actions";
import { SelectNativo } from "../ui/campos";
import { PaginaDeLista } from "../ui/pagina-de-lista";
import { Pilula } from "../ui/pilula";
import { usePaginacaoLocal } from "../../lib/usePaginacaoLocal";

const formatRelativeDays = (value) => {
  if (!value) return 'Sem registro';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return 'Sem registro';
  const diffDays = Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
  if (diffDays === 0) return 'há menos de 1 dia';
  if (diffDays === 1) return 'há 1 dia';
  return `há ${diffDays} dias`;
};

export default function Users() {
  const { profile, permissionsLoaded } = useContext(AuthContext);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "Deseja realmente excluir",
    subTitle: "Esta ação não poderá ser desfeita",
  });

  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.users);
  const { isOpenLoading } = useSelector((state) => state.layout);
  const [searchValue, setSearchValue] = useState("");
  const [presenceFilter, setPresenceFilter] = useState("all");

  useEffect(() => {
    if (!permissionsLoaded) return;
    dispatch(getAllUsers());
  }, [dispatch, permissionsLoaded]);

  useEffect(() => {
    if (!permissionsLoaded) return;
    if (profile !== "admin" && profile !== "user") {
      Router.push("/");
    }
  }, [profile, permissionsLoaded]);

  const filteredUsers = useMemo(() => {
    const term = searchValue.trim().toLowerCase();
    return users.filter((u) => {
      if (presenceFilter === "online" && !u?.is_online) return false;
      if (presenceFilter === "offline" && u?.is_online) return false;
      if (!term) return true;
      const name = (u?.name || "").toLowerCase();
      const email = (u?.email || "").toLowerCase();
      const cpf = (u?.cpf || "").toLowerCase();
      return name.includes(term) || email.includes(term) || cpf.includes(term);
    });
  }, [users, searchValue, presenceFilter]);

  const { fatia, propsDaPaginacao } = usePaginacaoLocal(filteredUsers);

  const handleEditUser = (user) => {
    dispatch(showUser(user));
    dispatch(turnUserModal());
  };

  const handleInactiveUser = (user) => {
    setConfirmDialog({
      ...confirmDialog,
      isOpen: true,
      title: `Deseja realmente inativar o usuário ${user.name}?`,
      confirm: inactiveUserFetch(user),
    });
    dispatch(changeTitleAlert(`O usuário ${user.name} foi inativado com sucesso!`));
  };

  const colunas = [
    {
      chave: "nome",
      titulo: "Nome / Perfil",
      render: (user) => (
        <>
          <span className="block font-semibold uppercase">{user?.name || ""}</span>
          <span className="block text-xs uppercase text-muted-foreground">{user?.profile || "user"}</span>
        </>
      ),
    },
    {
      chave: "contato",
      titulo: "CPF / E-mail",
      render: (user) => (
        <>
          <span className="block text-xs text-muted-foreground">{user?.cpf || "-"}</span>
          <span className="block break-all text-xs">{user?.email || "-"}</span>
        </>
      ),
    },
    {
      chave: "presenca",
      titulo: "Presença",
      render: (user) => (
        <div className="flex flex-col items-start gap-1">
          <Pilula tom={user?.is_online ? "sucesso" : "perigo"}>{user?.is_online ? "Online" : "Offline"}</Pilula>
          <span className="text-xs text-muted-foreground">
            {user?.is_online ? "Online agora" : `Última vez online ${formatRelativeDays(user?.last_seen_at)}`}
          </span>
        </div>
      ),
    },
    {
      chave: "acoes",
      titulo: "Ações",
      render: (user) => (
        <div className="flex gap-2">
          <ActionEditButton title="Editar usuário" onClick={() => handleEditUser(user)} />
          <ActionDeleteButton title="Inativar usuário" onClick={() => handleInactiveUser(user)} />
        </div>
      ),
    },
  ];

  const barra = (
    <>
      <div className="w-full sm:w-40">
        <SelectNativo aria-label="Status" value={presenceFilter} onChange={({ target }) => setPresenceFilter(target.value || "all")}>
          <option value="all">Status: todos</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
        </SelectNativo>
      </div>
      <ActionCreateFab title="Novo usuário" onClick={() => dispatch(turnUserModal())} />
    </>
  );

  return (
    <PaginaDeLista
      titulo="Usuários"
      subtitulo={`Você possui ${filteredUsers.length} Usuários Cadastrados`}
      busca={{ rotulo: "Pesquisar usuário", placeholder: "Pesquisar usuário: Nome / E-mail / CPF", name: "search", autoComplete: "off", value: searchValue, onChange: ({ target }) => setSearchValue(target.value || "") }}
      barra={barra}
      colunas={colunas}
      linhas={fatia}
      chaveDaLinha={(u) => u?.id}
      carregando={isOpenLoading}
      vazio="Nenhum registro encontrado!"
      rotuloDaTabela="tabela de usuários"
      paginacao={propsDaPaginacao}
    >
      <AlertModal />
      <ConfirmDialog confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />
    </PaginaDeLista>
  );
}
