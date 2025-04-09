import React, { useContext } from "react";
import FeatherIcon from "feather-icons-react";
import Image from "next/image";
import userimg from "../../../assets/images/users/user3.jpg";
import {
  Box,
  Menu,
  Typography,
  Link,
  Button,
  Divider,
  ListItemButton,
  ListItemText,
} from "@mui/material";

import { useDispatch } from "react-redux";
import { AuthContext } from "../../contexts/AuthContext";
import { logoutFetch } from "../../store/fetchActions/auth";
import UserModal from "../../components/modal/user";
import { turnUserModal } from "../../store/ducks/Layout";
import { getUserFetch } from "../../store/fetchActions/user";

import { ColorModeContext } from "../../contexts/ThemeContext";
import { Tooltip, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
// import { Moon, Sun } from "lucide-react"; // ou FeatherIcon se preferir


function logout(dispatch) {
  dispatch(logoutFetch());
}

const ProfileDD = () => {
  const [anchorEl4, setAnchorEl4] = React.useState(null);

  const handleClick4 = (event) => {
    setAnchorEl4(event.currentTarget);
  };

  const handleClose4 = () => {
    setAnchorEl4(null);
  };

  const dispatch = useDispatch();

  const { username } = useContext(AuthContext);
  const { user } = useContext(AuthContext);

  const HandleEditUser = async user => {
    dispatch(getUserFetch(user));
    dispatch(turnUserModal());
  }

  const { toggleColorMode, mode } = useContext(ColorModeContext);

  const theme = useTheme();

  return (
    <>
      <UserModal />
      <Button
        aria-label="menu"
        color="inherit"
        aria-controls="profile-menu"
        aria-haspopup="true"
        onClick={handleClick4}
      >
        <Box display="flex" alignItems="center">
          <Image
            src={userimg}
            alt={userimg}
            width="30"
            height="30"
            className="roundedCircle"
          />
          <Box
            sx={{
              display: {
                xs: "none",
                sm: "flex",
              },
              alignItems: "center",
            }}
          >
            <Typography
              color="textSecondary"
              variant="h5"
              fontWeight="400"
              sx={{ ml: 1 }}
            >
              Olá,
            </Typography>
            <Typography
              variant="h5"
              fontWeight="700"
              sx={{
                ml: 1,
              }}
            >
              {username}
            </Typography>
            <FeatherIcon icon="chevron-down" width="20" height="20" />
          </Box>
        </Box>
      </Button>
      <Button>
        <Tooltip title={mode === "dark" ? "Modo claro" : "Modo escuro"}>
          <IconButton
            onClick={toggleColorMode}
            sx={{ ml: 1 }}
            color="inherit"
            size="small"
          >
            <FeatherIcon
              icon={mode === "dark" ? "sun" : "moon"}
              width="18"
              height="18"
            />
          </IconButton>
        </Tooltip>
      </Button>
      <Menu
        id="profile-menu"
        anchorEl={anchorEl4}
        keepMounted
        open={Boolean(anchorEl4)}
        onClose={handleClose4}
        sx={{
          "& .MuiMenu-paper": {
            width: "385px",
          },
        }}
      >
        <Box>
          <ListItemButton>
            <ListItemText primary="Meus Dados" onClick={() => HandleEditUser(user)} />
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
