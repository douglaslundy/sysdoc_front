import { useEffect } from "react";
import { useRouter } from "next/router";
import { Box, Typography } from "@mui/material";

export default function AttendanceServiceCurrentPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("attendance.currentTicketId");
    if (saved) {
      router.replace(`/attendance/service/${saved}`);
      return;
    }
    router.replace("/attendance/queue");
  }, [router]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography>Redirecionando para o atendimento atual...</Typography>
    </Box>
  );
}

