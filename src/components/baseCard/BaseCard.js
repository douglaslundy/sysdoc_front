import React from "react";

import {
  Card,
  CardContent,
  Box,
  Typography,
} from "@mui/material";

const BaseCard = (props) => {
  return (
    <Card className="card info-card" sx={props.sx}>
      <Box p={2} pb={props.subtitle ? 1 : 2} display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
        <Box>
          <Typography variant="h4" className="card__title">{props.title}</Typography>
          {props.subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {props.subtitle}
            </Typography>
          ) : null}
        </Box>
        {props.action ? <Box>{props.action}</Box> : null}
      </Box>
      <CardContent className="card__content" sx={props.contentSx}>{props.children}</CardContent>
    </Card>
  );
};

export default BaseCard;
