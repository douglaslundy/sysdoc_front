import React from 'react';
import Head from 'next/head';
import { api } from "../../src/services/api";

export default function QueueDetails({ queue }) {
  if (!queue) {
    return (
      <>
        <Head>
          <title>Consulta Especialidades - SUS - Ilicínea</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </Head>
        <div className="container">
          {/* Logo centralizado */}
          <div className="logo-container">
            <img src="/file/brasao.png" alt="Logo" className="logo" />
          </div>
          {/* Informações do SUS com espaçamento entre linhas reduzido */}
          <div className="info-sus">
            <p>SECRETARIA MUNICIPAL DE SAÚDE DE ILICÍNEA</p>
            <p>Rua 02 de Novembro, 96 - Centro TEL: 0800 035 1319</p>
            <p>saude@ilicinea.mg.gov.br</p>
          </div>
          <header>
            {/* <h1>Detalhes da sua consulta</h1> */}
            <h1>Dados não encontrados </h1>
          </header>
          <main>
            <p>
              Verifique o link ou tente novamente mais tarde.
            </p>
          </main>
        </div>
        <style jsx>{`
        :root {
          --primary-color: #005EA6; /* Azul SUS */
          --secondary-color: #009639; /* Verde SUS */
          --background-color: #f4f4f4;
        }
        .container {
          min-height: 100vh;
          background-color: var(--background-color);
          padding: 20px;
          font-family: Arial, sans-serif;
          color: #000;
        }
        .logo-container {
          text-align: center;
          margin-bottom: 20px;
        }
        .logo {
          max-width: 150px;
          width: 100%;
          height: auto;
        }
        .info-sus {
          text-align: center;
          margin-bottom: 10px;
          font-size: 1.1rem;
          line-height: 0.5; /* Diminuindo o espaçamento entre linhas */
        }
        .info-sus p {
          margin-bottom: 0; /* Remove margem extra entre parágrafos */
        }
        header {
          background-color: var(--primary-color);
          padding: 20px;
          text-align: center;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        header h1 {
          margin: 0;
          font-size: 2rem;
          color: #000;
        }
        main {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .card {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          width: 100%;
        }
        .card p {
          font-size: 1.1rem;
          margin-bottom: 10px;
          color: #000;
        }
        .card strong {
          color: #000;
        }
      `}</style>

      </>
    );
  }



  return (
    <>
      <Head>
        <title>Consulta Especialidades - SUS - Ilicínea</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="container">
        {/* Logo centralizado */}
        <div className="logo-container">
          <img src="/file/brasao.png" alt="Logo" className="logo" />
        </div>
        {/* Informações do SUS com espaçamento entre linhas reduzido */}
        <div className="info-sus">
          <p>SECRETARIA MUNICIPAL DE SAÚDE DE ILICÍNEA</p>
          <p>Rua 02 de Novembro, 96 - Centro TEL: 0800 035 1319</p>
          <p>saude@ilicinea.mg.gov.br</p>
        </div>
        <header>
          {/* <h1>Detalhes da sua consulta</h1> */}
          <h1>PROTOCOLO Nº {queue.id}</h1>
        </header>
        <main>
          <div className="card">
            <p>
              <strong>STATUS:</strong> {queue.done == '0' ? 'EM ESPERA' : 'REALIZADO'}
            </p>
            <p>
              <strong>POSIÇÃO:</strong> {queue.position}
            </p>
            <p>
              <strong>FILA:</strong> {queue.urgency == 1 ? 'URGÊNCIA' : 'COMUM'}
            </p>
            <p>
              {/* <strong>Nome do Cliente:</strong> {queue.client?.name || 'Não informado'} */}
              <strong>Nome do Cliente:</strong> Informação omitida em conformidade com a LGPD
            </p>
            <p>
              <strong>Especialidade:</strong> {queue.speciality?.name || 'Não informado'}
            </p>
            <p>
              <strong>Entrou na fila em:</strong> {new Date(queue.created_at).toLocaleString('pt-BR')}
            </p>
            <p>
              <strong>Última movimentação:</strong> {new Date(queue.updated_at).toLocaleString('pt-BR')}
            </p>
          </div>
        </main>
      </div>
      <style jsx>{`
        :root {
          --primary-color: #005EA6; /* Azul SUS */
          --secondary-color: #009639; /* Verde SUS */
          --background-color: #f4f4f4;
        }
        .container {
          min-height: 100vh;
          background-color: var(--background-color);
          padding: 20px;
          font-family: Arial, sans-serif;
          color: #000;
        }
        .logo-container {
          text-align: center;
          margin-bottom: 20px;
        }
        .logo {
          max-width: 150px;
          width: 100%;
          height: auto;
        }
        .info-sus {
          text-align: center;
          margin-bottom: 10px;
          font-size: 1.1rem;
          line-height: 0.5; /* Diminuindo o espaçamento entre linhas */
        }
        .info-sus p {
          margin-bottom: 0; /* Remove margem extra entre parágrafos */
        }
        header {
          background-color: var(--primary-color);
          padding: 20px;
          text-align: center;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        header h1 {
          margin: 0;
          font-size: 2rem;
          color: #000;
        }
        main {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .card {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          width: 100%;
        }
        .card p {
          font-size: 1.1rem;
          margin-bottom: 10px;
          color: #000;
        }
        .card strong {
          color: #000;
        }
      `}</style>
    </>
  );
}

export async function getServerSideProps({ params }) {
  let uuid = '0';
  if (params && params.uuid) {
    uuid = Array.isArray(params.uuid) ? params.uuid[0] : params.uuid;
  }

  try {
    const { data } = await api.get(`/queues/uuid/${uuid}`);
    return {
      props: {
        queue: data,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar os dados da queue:', error);
    return {
      props: {
        queue: null, // <-- Isso evita o 404 e permite renderizar a página com a mensagem
      },
    };
  }
}