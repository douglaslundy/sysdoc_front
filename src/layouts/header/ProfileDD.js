import React, { useContext, useEffect, useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useDispatch } from "react-redux";
import { AuthContext } from "../../contexts/AuthContext";
import { logoutFetch } from "../../store/fetchActions/auth";
import UserModal from "../../components/modal/user";
import { turnUserModal } from "../../store/ducks/Layout";
import { getUserFetch } from "../../store/fetchActions/user";
import { Button } from "../../components/ui/button";
import { Menu, MenuConteudo, MenuItem, MenuTrigger } from "../../components/ui/menu";
import { useFotoPessoa } from "../../lib/fotoPessoa";

const getInitials = (name) => {
  if (!name) return "US";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
};

const formatProfileLabel = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";

  return normalized
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

/** Avatar + nome (nome some no celular) e menu "Meus Dados / Sair". */
const ProfileDD = () => {
  const dispatch = useDispatch();
  const { username, user, profile } = useContext(AuthContext);
  const [mounted, setMounted] = useState(false);
  const foto = useFotoPessoa("users", mounted ? user : null);

  useEffect(() => { setMounted(true); }, []);

  const handleEditUser = (userId) => {
    dispatch(getUserFetch(userId));
    dispatch(turnUserModal());
  };

  const identidade = mounted ? `${username || ""}${profile ? ` - ${formatProfileLabel(profile)}` : ""}` : "";

  return (
    <>
      <UserModal />
      <Menu>
        <MenuTrigger
          aria-label="Menu do usuário"
          render={<Button variant="ghost" size="default" className="max-w-[260px] gap-2 px-2 sm:px-3" />}
        >
          <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-xs font-semibold text-primary-text">
            {foto ? <img src={foto} alt="" className="size-full rounded-full object-cover" /> : mounted ? getInitials(username) : ""}
          </span>
          <span className="hidden min-w-0 truncate text-sm text-foreground sm:inline">{identidade}</span>
          <ChevronDown aria-hidden className="hidden size-3.5 shrink-0 sm:inline" />
        </MenuTrigger>
        <MenuConteudo>
          <p className="truncate px-3 py-2 text-xs text-muted-foreground sm:hidden">{identidade}</p>
          <MenuItem onClick={() => handleEditUser(user)}>
            <UserRound className="size-4" aria-hidden /> Meus Dados
          </MenuItem>
          <MenuItem onClick={() => dispatch(logoutFetch())}>
            <LogOut className="size-4" aria-hidden /> Sair
          </MenuItem>
        </MenuConteudo>
      </Menu>
    </>
  );
};

export default ProfileDD;
