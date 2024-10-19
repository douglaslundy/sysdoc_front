import React from "react";
import { Link } from "@mui/material";
import Image from "next/image";
import LogoDark from "../../../assets/images/logos/logo.png";
import Brasao from "../../../assets/images/logos/brasao.png";

const LogoIcon = () => {
  return (
    <Link href="/">
      <Image width={200} height={80} src={LogoDark} alt={LogoDark} />
      <Image width={200} height={80} src={Brasao} alt={Brasao} />
    </Link>
  );
};

export default LogoIcon;
