import { useEffect } from "react";
import { useRouter } from "next/router";
import { Carregando } from "../../../src/components/ui/carregando";

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
    <div className="ui-reset p-6">
      <Carregando>Redirecionando para o atendimento atual...</Carregando>
    </div>
  );
}
