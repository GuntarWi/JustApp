// src/renderer/src/pages/RoundID.jsx
import React, { useState, useEffect } from 'react';
import TableViewer from '../components/TableViewer';

const RoundID = ({ clientType }) => {
  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [roundId, setRoundId] = useState('');

  useEffect(() => {
    const loadQueries = async () => {
      const savedQueries = await window.electron.getConfig(`${clientType}-queries`);
      setQueries(savedQueries || []);
      const defaultQuery = savedQueries.find(query => query.name === 'Round');
      if (defaultQuery) {
        setSelectedQuery(defaultQuery.text);
      }
    };
    loadQueries();
  }, [clientType]);

  const executeQuery = async () => {
    try {
      let queryText = selectedQuery;
      if (roundId) {
        queryText += ` WHERE id = ${roundId}`;
      }
      const result = await window.electron.executeQuery({
        clientType,
        query: queryText,
      });
      setQueryResult(result);
    } catch (error) {
      console.error('Query Execution Error:', error);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Round ID</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">Round ID</label>
        <input
          type="text"
          value={roundId}
          onChange={(e) => setRoundId(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Select Query</label>
        <select
          value={selectedQuery}
          onChange={(e) => setSelectedQuery(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
        >
          <option value="">Select a query</option>
          {queries.map((query) => (
            <option key={query.name} value={query.text}>{query.name}</option>
          ))}
        </select>
      </div>
      <button
        onClick={executeQuery}
        className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Execute Query
      </button>
      {queryResult && <TableViewer data={queryResult} />}
    </div>
  );
};

export default RoundID;
