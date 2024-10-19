import React from "react";
import { Link } from "@mui/material";
import Image from "next/image";
import LogoDark from "../../../assets/images/logos/logo.png";

const LogoIcon = () => {
  return (
    <Link href="/">
      <Image width={200} height={80} src={LogoDark} alt={LogoDark} />
    </Link>
  );
};

export default LogoIcon;
