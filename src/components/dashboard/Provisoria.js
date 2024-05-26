import React from 'react';

const Dashboard = () => {
  // Insira o URL público gerado pelo Metabase
  const iframeUrl = 'https://mb.dlsistemas.com.br/public/dashboard/6cca9f5d-fa00-4765-9ad5-501492d622b1';

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
