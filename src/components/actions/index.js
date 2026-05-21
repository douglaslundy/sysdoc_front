import React from "react";
import { Button, Fab } from "@mui/material";
import FeatherIcon from "feather-icons-react";

const iconSize = 20;

export function ActionViewButton({ title = "Visualizar", icon = "eye", ...props }) {
  return (
    <Button title={title} color="info" size="medium" variant="contained" {...props}>
      <FeatherIcon icon={icon} width={iconSize} height={iconSize} />
    </Button>
  );
}

export function ActionEditButton({ title = "Editar", icon = "edit", ...props }) {
  return (
    <Button title={title} color="success" size="medium" variant="contained" {...props}>
      <FeatherIcon icon={icon} width={iconSize} height={iconSize} />
    </Button>
  );
}

export function ActionDeleteButton({ title = "Excluir", icon = "trash", ...props }) {
  return (
    <Button title={title} color="error" size="medium" variant="contained" {...props}>
      <FeatherIcon icon={icon} width={iconSize} height={iconSize} />
    </Button>
  );
}

export function ActionCreateFab({ icon = "plus", ...props }) {
  return (
    <Fab color="primary" aria-label="add" {...props}>
      <FeatherIcon icon={icon} />
    </Fab>
  );
}
