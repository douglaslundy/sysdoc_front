import React, { useContext } from "react";
import FeatherIcon from "feather-icons-react";
import {
  Box,
  Menu,
  Typography,
  Link,
  Button,
  Divider,
  ListItemButton,
  ListItemText,
  Tooltip,
  IconButton,
} from "@mui/material";

import { useDispatch } from "react-redux";
import { AuthContext } from "../../contexts/AuthContext";
import { logoutFetch } from "../../store/fetchActions/auth";
import UserModal from "../../components/modal/user";
import { turnUserModal } from "../../store/ducks/Layout";
import { getUserFetch } from "../../store/fetchActions/user";
import { ColorModeContext } from "../../contexts/ThemeContext";

function logout(dispatch) {
  dispatch(logoutFetch());
}

const getInitials = (name) => {
  if (!name) return "US";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
};

const ProfileDD = () => {
  const [anchorEl4, setAnchorEl4] = React.useState(null);

  const handleClick4 = (event) => {
    setAnchorEl4(event.currentTarget);
  };

  const handleClose4 = () => {
    setAnchorEl4(null);
  };

  const dispatch = useDispatch();

  const { username, user } = useContext(AuthContext);

  const handleEditUser = async (userId) => {
    dispatch(getUserFetch(userId));
    dispatch(turnUserModal());
  };

  const { toggleColorMode, mode } = useContext(ColorModeContext);

  return (
    <>
      <UserModal />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Tooltip title={mode === "dark" ? "Modo claro" : "Modo escuro"}>
          <IconButton
            onClick={toggleColorMode}
            aria-label="Alternar tema"
            size="small"
            className="theme-toggle-btn"
            sx={{
              width: "34px",
              height: "34px",
              borderRadius: "9px",
              border: "0.5px solid var(--lg-border-input)",
              background: "var(--lg-glass-input)",
              color: "var(--lg-text-secondary)",
              backdropFilter: "blur(8px)",
              transition: "all 0.14s ease",
              "&:hover": {
                background: "var(--lg-glass-input-focus)",
                color: "var(--lg-text-primary)",
                transform: "scale(1.07)",
              },
            }}
          >
            <FeatherIcon icon={mode === "dark" ? "sun" : "moon"} width="18" height="18" />
          </IconButton>
        </Tooltip>

        <Button
          aria-label="menu"
          color="inherit"
          aria-controls="profile-menu"
          aria-haspopup="true"
          onClick={handleClick4}
          sx={{
            textTransform: "none",
            padding: "5px 12px 5px 5px",
            background: "var(--lg-glass-chip)",
            border: "0.5px solid var(--lg-border)",
            borderRadius: "40px",
            backdropFilter: "var(--lg-blur-input)",
            WebkitBackdropFilter: "var(--lg-blur-input)",
            color: "var(--lg-text-secondary)",
            boxShadow: "0 1px 4px rgba(var(--lg-accent-rgb), 0.1), 0 1px 0 rgba(255,255,255,0.2) inset",
            "&:hover": {
              background: "var(--lg-glass-panel-hover)",
            },
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              sx={{
                width: "26px",
                height: "26px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "10px",
                fontWeight: 600,
                background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                flexShrink: 0,
              }}
            >
              {getInitials(username)}
            </Box>
            <Box
              sx={{
                display: {
                  xs: "none",
                  sm: "flex",
                },
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontSize: "12px", color: "var(--lg-text-secondary)", mr: 0.5 }}>
                {username}
              </Typography>
              <FeatherIcon icon="chevron-down" width="14" height="14" style={{ opacity: 0.4 }} />
            </Box>
          </Box>
        </Button>
      </Box>

      <Menu
        id="profile-menu"
        anchorEl={anchorEl4}
        keepMounted
        open={Boolean(anchorEl4)}
        onClose={handleClose4}
        sx={{
          "& .MuiMenu-paper": {
            width: "320px",
          },
        }}
      >
        <Box>
          <ListItemButton>
            <ListItemText primary="Meus Dados" onClick={() => handleEditUser(user)} />
          </ListItemButton>

          <Divider />
          <Box p={2}>
            <Link to="/">
              <Button fullWidth variant="contained" color="primary" onClick={() => logout(dispatch)}>
                Logout
              </Button>
            </Link>
          </Box>
        </Box>
      </Menu>
    </>
  );
};

export default ProfileDD;
