// src/renderer/src/pages/Client3.js
import React, { useState, useEffect } from 'react';

const Client3 = () => {
  const [config, setConfig] = useState({});

  useEffect(() => {
    window.electron.getConfig('client3').then(setConfig);
  }, []);

  const saveConfig = (newConfig) => {
    setConfig(newConfig);
    window.electron.saveConfig('client3', newConfig);
  };

  return (
    <div className="p-4">
      <h1>Client 3 - ClickHouse</h1>
      {/* Add UI to manage connections, queries, and execute them */}
      <button onClick={() => saveConfig({ example: 'value' })}>Save Config</button>
    </div>
  );
};

export default Client3;
