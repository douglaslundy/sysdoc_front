import React from "react";

import {
  Card,
  CardContent,
  Divider,
  Box,
  Typography,
  Chip,
} from "@mui/material";

const BaseCard = (props) => {
  return (
    <Card className="card info-card">
      <Box p={2} display="flex" alignItems="center">
        <Typography variant="h4" className="card__title">{props.title}</Typography>
      </Box>
      <CardContent className="card__content">{props.children}</CardContent>
    </Card>
  );
};

export default BaseCard;
