import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";

import {
  Grid,
  Stack,
  TextField,
  Alert,
  Button,
  Typography,
} from "@mui/material";

import BaseCard from "../../baseCard/BaseCard";

import { showService } from "../../../store/ducks/service_calls";
import { turnModal, changeTitleAlert } from "../../../store/ducks/Layout";
import { editServiceFetch, addServiceFetch } from "../../../store/fetchActions/service_calls";
import AlertModal from "../../messagesModal";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "760px",
  maxWidth: "96vw",
  maxHeight: "92vh",
  overflow: "auto",
  background: "var(--lg-glass-modal)",
  backdropFilter: "var(--lg-blur-modal)",
  WebkitBackdropFilter: "var(--lg-blur-modal)",
  border: "0.5px solid var(--lg-border)",
  borderTop: "1px solid var(--lg-border-strong)",
  boxShadow: "var(--lg-shadow-modal)",
  borderRadius: "20px",
  p: 3.2,
};

export default function ServiceModal(props) {
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const { name, description } = form;
  const { service } = useSelector((state) => state.services);
  const { isOpenModal } = useSelector((state) => state.layout);
  const dispatch = useDispatch();

  const [texto, setTexto] = useState();

  const changeItem = ({ target }) => {
    setForm({ ...form, [target.name]: target.value });
  };

  const cleanForm = () => {
    setForm({
      name: "",
      description: "",
    });
    setTexto("");
    dispatch(turnModal());
    dispatch(showService({}));
  };

  const handleSaveData = async () => {
    service && service.id ? handlePutData() : handlePostData();
  };

  const handlePostData = async () => {
    dispatch(changeTitleAlert("O servico foi cadastrado com sucesso!"));
    dispatch(addServiceFetch(form, cleanForm));
  };

  const handlePutData = async () => {
    dispatch(changeTitleAlert(`O servico ${form.name} foi atualizado com sucesso!`));
    dispatch(editServiceFetch(form, cleanForm));
  };

  const handleClose = () => {
    cleanForm();
  };

  useEffect(() => {
    if (service && service.id) setForm(service);
  }, [service]);

  return (
    <div>
      {props.children}
      <Modal
        keepMounted
        open={isOpenModal}
        onClose={handleClose}
        aria-labelledby="keep-mounted-modal-title"
        aria-describedby="keep-mounted-modal-description"
        slotProps={{
          backdrop: {
            sx: {
              background: "var(--lg-overlay-bg)",
              backdropFilter: "var(--lg-blur-overlay)",
              WebkitBackdropFilter: "var(--lg-blur-overlay)",
            },
          },
        }}
      >
        <Box
          sx={{
            ...style,
            "& .MuiCard-root": {
              background: "transparent",
              boxShadow: "none",
            },
            "& .MuiCardContent-root": {
              p: 0,
            },
            "& .MuiInputLabel-root": {
              fontSize: "10px",
              fontWeight: 700,
              color: "var(--lg-text-muted)",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
            },
            "& .MuiInputBase-root": {
              background: "var(--lg-glass-input)",
              border: "0.5px solid var(--lg-border-input)",
              borderRadius: "10px",
              color: "var(--lg-text-primary)",
              boxShadow: "0 1px 3px rgba(var(--lg-accent-rgb), 0.05), 0 1px 0 rgba(255,255,255,0.1) inset",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
            "& .MuiInputBase-root.Mui-focused": {
              background: "var(--lg-glass-input-focus)",
              boxShadow: "var(--lg-focus-ring)",
            },
            "& .MuiInputBase-input::placeholder": {
              color: "var(--lg-text-muted)",
              opacity: 1,
            },
          }}
        >
          <AlertModal />

          <Grid container spacing={0}>
            <Grid item xs={12}>
              <BaseCard title={service && service.id ? "Editar Servico" : "Cadastrar Servico"}>
                {texto && <Alert variant="filled" severity="warning">{texto}</Alert>}

                <Typography
                  sx={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "var(--lg-text-muted)",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    mb: 2,
                  }}
                >
                  Dados do servico
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    className="lg-search-field"
                    label={name?.length > 0 ? `Nome: ${50 - name.length} caracteres restantes` : "Nome"}
                    variant="outlined"
                    name="name"
                    value={name || ""}
                    onChange={changeItem}
                    required
                    inputProps={{
                      style: {
                        textTransform: "uppercase",
                      },
                      maxLength: 50,
                    }}
                  />

                  <TextField
                    className="lg-search-field"
                    id="description"
                    label={description?.length > 0 ? `Descricao: ${200 - description.length} caracteres restantes` : "Descricao"}
                    multiline
                    rows={3}
                    value={description || ""}
                    name="description"
                    onChange={changeItem}
                    inputProps={{
                      style: {
                        textTransform: "uppercase",
                      },
                      maxLength: 200,
                    }}
                  />
                </Stack>

                <Box sx={{ display: "flex", gap: 1, mt: 2.2 }}>
                  <Button
                    onClick={handleSaveData}
                    variant="contained"
                    sx={{
                      flex: 1,
                      py: 1.2,
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, var(--lg-accent), #6D28D9)",
                      boxShadow: "var(--lg-shadow-btn)",
                      textTransform: "none",
                      fontSize: "14px",
                      "&:hover": {
                        opacity: 0.92,
                        transform: "translateY(-1px)",
                        boxShadow: "var(--lg-shadow-btn-hover)",
                        background: "linear-gradient(135deg, var(--lg-accent-hover), #7C3AED)",
                      },
                    }}
                  >
                    Gravar
                  </Button>

                  <Button
                    onClick={cleanForm}
                    variant="outlined"
                    sx={{
                      py: 1.2,
                      px: 2.2,
                      borderRadius: "10px",
                      background: "var(--lg-glass-input)",
                      border: "0.5px solid var(--lg-border-input)",
                      color: "var(--lg-text-secondary)",
                      textTransform: "none",
                      "&:hover": {
                        background: "var(--lg-glass-input-focus)",
                        color: "var(--lg-text-primary)",
                        border: "0.5px solid var(--lg-border-input)",
                      },
                    }}
                  >
                    Cancelar
                  </Button>
                </Box>
              </BaseCard>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </div>
  );
}

