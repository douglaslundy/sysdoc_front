import React from "react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

// Cartão com título, subtítulo e ação opcionais (telas ainda não migradas para o Card direto).
const BaseCard = ({ title, subtitle, action, className, children }) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
      {action ? <CardAction>{action}</CardAction> : null}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

export default BaseCard;
