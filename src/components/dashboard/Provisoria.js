import React from 'react';

const Dashboard = () => {
  // Insira o URL público gerado pelo Metabase
  const iframeUrl = 'https://mtb.dlsistemas.com.br/public/dashboard/07d1de25-46d5-4ee2-9394-167ff1643831';

  return (
    <div>
      {/* <h1>Dashboard Embutido</h1> */}
      <iframe
        src={iframeUrl}
        frameBorder="0"
        width="1200"
        height="800"
        allowTransparency
      ></iframe>
    </div>
  );
};

export default Dashboard;
