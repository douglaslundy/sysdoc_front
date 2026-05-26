import React from 'react';

const Dashboard = () => {
  const iframeUrl = 'https://lookerstudio.google.com/embed/reporting/30e41f91-0f96-42da-9911-717027216ff8/page/a86tD';

  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: '75%' }}>
      <iframe
        src={iframeUrl}
        frameBorder="0"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        allowTransparency
        allowFullScreen
        title="Dashboard Responsivo"
      ></iframe>
    </div>
  );
};

export default Dashboard;
