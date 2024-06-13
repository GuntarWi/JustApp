// src/renderer/src/pages/Client3.js
import React, { useState, useEffect } from 'react';

const Client3 = () => {
  const [config, setConfig] = useState({});
  const [queryResult, setQueryResult] = useState(null);

  useEffect(() => {
    window.electron.getConfig('client3').then(setConfig);
  }, []);

  const saveConfig = (newConfig) => {
    setConfig(newConfig);
    window.electron.saveConfig('client3', newConfig);
  };

  const executeQuery = async () => {
    try {
      const result = await window.electron.executeQuery({
        clientType: 'clickhouse',
        query: 'SELECT NOW()',
      });
      setQueryResult(result);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-4">
      <h1>Client 3 - ClickHouse</h1>
      {/* Add UI to manage connections, queries, and execute them */}
      <button onClick={() => saveConfig({ example: 'value' })}>Save Config</button>
      <button onClick={executeQuery}>Execute Query</button>
      {queryResult && <pre>{JSON.stringify(queryResult, null, 2)}</pre>}
    </div>
  );
};

export default Client3;
