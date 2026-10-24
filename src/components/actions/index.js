import React from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";

// Botões de ação de linha de tabela e de criação, no padrão do layout CRM.
// `icon` (nome Feather) e `className` existiam na versão antiga e são ignorados.
const botaoDeIcone = (variant, Icone, tituloPadrao) =>
  function BotaoDeAcao({ title = tituloPadrao, icon, className, ...props }) {
    return (
      <Button variant={variant} size="icon-sm" title={title} aria-label={title} {...props}>
        <Icone />
      </Button>
    );
  };

export const ActionViewButton = botaoDeIcone("secondary", Eye, "Visualizar");
export const ActionEditButton = botaoDeIcone("success", Pencil, "Editar");
export const ActionDeleteButton = botaoDeIcone("destructive", Trash2, "Excluir");

/** Botão de criar com rótulo (o antigo era um Fab só com ícone). */
export function ActionCreateFab({ title = "Novo", icon, className, ...props }) {
  return (
    <Button title={title} {...props}>
      <Plus /> {title}
    </Button>
  );
}
