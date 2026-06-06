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
  const [mounted, setMounted] = React.useState(false);

  const handleClick4 = (event) => {
    setAnchorEl4(event.currentTarget);
  };

  const handleClose4 = () => {
    setAnchorEl4(null);
  };

  const dispatch = useDispatch();

  const { username, user } = useContext(AuthContext);

  React.useEffect(() => { setMounted(true); }, []);

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
          className="profile-dd-trigger"
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              className="profile-dd-avatar"
            >
              {mounted ? getInitials(username) : ""}
            </Box>
            <Box
              className="profile-dd-identity"
            >
              <Typography className="profile-dd-username">
                {mounted ? username : ""}
              </Typography>
              <FeatherIcon className="profile-dd-chevron" icon="chevron-down" width="14" height="14" />
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
        PaperProps={{
          className: "profile-dd-menu-paper",
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
