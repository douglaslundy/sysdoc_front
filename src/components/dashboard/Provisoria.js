import React from 'react';

const Dashboard = () => {
  // Insira o URL público gerado pelo Metabase
  // const iframeUrl = 'https://mb.dlsistemas.com.br/public/dashboard/4ece421e-7679-40dc-b0bd-76195dfcb64c';
  const iframeUrl = 'https://lookerstudio.google.com/embed/reporting/30e41f91-0f96-42da-9911-717027216ff8/page/a86tD';

  return (
    <div>
      {/* <h1>Dashboard Embutido</h1> */}
      <iframe
        src={iframeUrl}
        frameBorder="0"
        width="1200"
        height="900"
        allowTransparency
      >
      </iframe>
    </div>
  );
};

export default Dashboard;
