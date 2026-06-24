import { useEffect } from "react";
import { useRouter } from "next/router";

export default function ProtocoloConfiguracoesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/configuracoes/whatsapp");
  }, [router]);

  return null;
}
