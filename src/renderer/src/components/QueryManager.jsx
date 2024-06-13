import React, { useState, useEffect } from 'react';
import { AiOutlinePlaySquare,AiOutlineEdit,AiOutlineDelete    } from 'react-icons/ai'; 

const QueryManager = ({ clientType }) => {
  const [queries, setQueries] = useState([]);
  const [queryName, setQueryName] = useState('');
  const [queryText, setQueryText] = useState('SELECT id, "name" FROM public.test'); // Hardcoded query
  const [queryResult, setQueryResult] = useState(null);
  const [error, setError] = useState(null);
  const [editingQuery, setEditingQuery] = useState(null);

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    const savedQueries = await window.electron.loadConnectionDetails(`${clientType}-queries`);
    console.log(`Loaded queries for ${clientType}:`, savedQueries);
    setQueries(savedQueries || []);
  };

  const saveQuery = async () => {
    if (!queryName || !queryText) {
      setError('Query name and text cannot be empty.');
      return;
    }

    // Basic validation to check for incomplete SQL statements
    if (queryText.trim().endsWith("WHERE") || queryText.trim().endsWith("AND") || queryText.trim().endsWith("OR")) {
      setError('Query text appears to be incomplete.');
      return;
    }

    const newQuery = { name: queryName, text: queryText };
    let updatedQueries;
    if (editingQuery) {
      updatedQueries = queries.map(q => q.name === editingQuery.name ? newQuery : q);
    } else {
      updatedQueries = [...queries, newQuery];
    }

    console.log(`Saving queries for ${clientType}:`, updatedQueries);
    await window.electron.saveConnectionDetails(`${clientType}-queries`, updatedQueries);
    setQueries(updatedQueries);
    setQueryName('');
    setQueryText('SELECT id, "name" FROM test'); // Reset to hardcoded query after save
    setEditingQuery(null);
    setError(null);
  };

  const deleteQuery = async (queryToDelete) => {
    const updatedQueries = queries.filter((q) => q.name !== queryToDelete.name);
    console.log(`Deleting query for ${clientType}:`, queryToDelete);
    await window.electron.saveConnectionDetails(`${clientType}-queries`, updatedQueries);
    setQueries(updatedQueries);
  };

  const executeQuery = async (query) => {
    try {
      if (!query.text) {
        setError('Query text cannot be empty.');
        return;
      }

      // Basic validation to check for incomplete SQL statements
      if (query.text.trim().endsWith("WHERE") || query.text.trim().endsWith("AND") || query.text.trim().endsWith("OR")) {
        setError('Query text appears to be incomplete.');
        return;
      }

      console.log(`Executing Query: ${query.text}`);
      const result = await window.electron.executeQuery({
        clientType,
        query: query.text,
      });
      console.log('Query Result:', result);
      setQueryResult(result);
      setError(null);
    } catch (error) {
      setError(`Error: ${error.message}`);
      console.error('Query Execution Error:', error);
    }
  };

  const editQuery = (query) => {
    setQueryName(query.name);
    setQueryText(query.text);
    setEditingQuery(query);
  };

  return (
    <div className="mt-3 ml-10 w-full grid grid-cols-2 gap-4">
      <div className=''>
      <h2 className="text-xl font-bold">Manage Queries</h2>
      {error && <div className="text-red-600">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-gray-700">Query Name</label>
        <input
          type="text"
          value={queryName}
          onChange={(e) => setQueryName(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Query Text</label>
        <textarea
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
        />
      </div>
      <button
        onClick={saveQuery}
        className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {editingQuery ? 'Update Query' : 'Save Query'}
      </button>
      <h3 className="text-lg font-semibold mt-6">Saved Queries</h3>
      <ul className="space-y-2 flex-1">
        {queries.map((query) => (
          <li key={query.name} className="flex justify-between items-center p-2 border border-gray-300 rounded-md">
            <span>{query.name}</span>
            <div>
              <button
                onClick={() => executeQuery(query)}
                className="inline-flex overflow-hidden text-white bg-gray-700 rounded group h-8 mr-5"
              >

            <span className="h-full px-2 py-2 text-white bg-gray-600 group-hover:bg-purple-600 flex items-center justify-center">
              <AiOutlinePlaySquare  className="mr-2" />

              </span>
              <span className="pl-3 pr-4 py-1 text-center">Execute</span>
                
              </button>
              <button
                onClick={() => editQuery(query)}
                className="inline-flex overflow-hidden text-white bg-gray-700 rounded group h-8 mr-5"
              >

                <span className="h-full px-2 py-2 text-white bg-gray-600 group-hover:bg-purple-600 flex items-center justify-center">
              <AiOutlineEdit   className="mr-2" />

              </span>
              <span className="pl-3 pr-4 py-1 text-center">Edit</span>
              </button>
              <button
                onClick={() => deleteQuery(query)}
                className="inline-flex overflow-hidden text-white bg-gray-700 rounded group h-8 mr-5"
              >

              <span className="h-full px-2 py-2 text-white bg-red-400 group-hover:bg-red-500 flex items-center justify-center">
              <AiOutlineDelete    className="mr-2" />

              </span>
              <span className="pl-3 pr-4 py-1 text-center">Delete</span>

              </button>
            </div>
          </li>
        ))}
      </ul>
      </div>
     
      <div>
      {queryResult && <pre className="grid grid-cols-subgrid gap-4 col-span-3 mt-4 bg-gray-100 p-4 rounded flex">{JSON.stringify(queryResult, null, 2)}</pre>}
      </div>
    </div>
  );
};

export default QueryManager;
