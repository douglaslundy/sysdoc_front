export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/laboratorio/pedidos",
      permanent: false,
    },
  };
}

export default function ResultadosIndexPage() {
  return null;
}
