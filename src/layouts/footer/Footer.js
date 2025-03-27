import React from "react";
import { Box, Typography } from "@mui/material";
import Link from "next/link";
const Footer = () => {
  return (
    <Box sx={{ p: 3, textAlign: "center" }}>
      <Typography>
        © 2022 All rights reserved by{" "}
        <Link href="https://www.dlsistemas.com.br">
          <a>www.dlsistemas.com.br</a>
        </Link>{" "}
      </Typography>

      <Typography
        variant="h5"
        fontWeight="700"
        sx={{
          ml: 1,
        }}
      >
        Licença: {Math.round((new Date('2026-01-01') - new Date((`${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`).toString())) / (1000 * 60 * 60 * 24))} dias restantes
      </Typography>


    </Box>
  );
};

export default Footer;
