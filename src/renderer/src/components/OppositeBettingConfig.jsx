import React, { useState, useEffect } from 'react';

const OppositeBettingConfig = ({ clientType, onUpdateQuery }) => {
  const [roundQuery, setRoundQuery] = useState('');

  useEffect(() => {
    const loadConfig = async () => {
      const savedConfig = await window.electron.getConfig(`${clientType}-round-query`);
      if (savedConfig) {
        setRoundQuery(savedConfig.roundQuery || '');
      }
    };
    loadConfig();
  }, [clientType]);

  const saveConfig = async () => {
    const newConfig = { roundQuery };
    await window.electron.saveConfig(`${clientType}-round-query`, newConfig);
    onUpdateQuery(newConfig.roundQuery);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Opposite Betting Configuration</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">Round Query</label>
        <textarea
          value={roundQuery}
          onChange={(e) => setRoundQuery(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
          rows="5"
        />
      </div>
      <button
        onClick={saveConfig}
        className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Save Configuration
      </button>
    </div>
  );
};

export default OppositeBettingConfig;
