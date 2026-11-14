import { useRouter } from "next/router";
import DetalheOs from "../../src/components/ordem-servico/DetalheOs";

export default function DetalheOsPage() {
    const router = useRouter();
    return <DetalheOs id={router.query.id} />;
}
