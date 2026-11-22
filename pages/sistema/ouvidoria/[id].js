import { useRouter } from "next/router";
import DetalheOuvidoria from "../../../src/components/ouvidoria/DetalheOuvidoria";

export default function OuvidoriaDetalhePage() {
    const { query } = useRouter();
    return <DetalheOuvidoria id={query.id} />;
}
