import React from 'react';

const Dashboard = () => {
  // Insira o URL público gerado pelo Metabase
  const iframeUrl = 'https://mb.dlsistemas.com.br/public/dashboard/4ece421e-7679-40dc-b0bd-76195dfcb64c';

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
      Version - <h5>2.1.6</h5>
    </div>
  );
};

export default Dashboard;
