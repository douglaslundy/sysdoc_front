import React from "react";
import NextLink from "next/link";
import { Box, Link, Typography } from "@mui/material";

const LogoIcon = () => {
  return (
    <Link
      component={NextLink}
      href="/dashboard"
      underline="none"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
      }}
    >
      <Box
        className="lg-logo-icon"
        sx={{
          width: 34,
          height: 34,
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: "13px",
          flexShrink: 0,
        }}
      >
        DL
      </Box>
      <Box>
        <Typography
          sx={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--lg-text-primary)",
            lineHeight: 1.2,
          }}
        >
          DL Sistemas
        </Typography>
        <Typography
          sx={{
            fontSize: "9.5px",
            color: "var(--lg-text-muted)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            lineHeight: 1.1,
          }}
        >
          Gestao Municipal
        </Typography>
      </Box>
    </Link>
  );
};

export default LogoIcon;
