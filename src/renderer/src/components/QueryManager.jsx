import React, { useState, useEffect } from 'react';
import { AiOutlinePlaySquare, AiOutlineEdit, AiOutlineDelete, AiOutlinePlus, AiOutlineExpand } from "react-icons/ai";
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { dracula } from '@uiw/codemirror-theme-dracula';
import Modal from 'react-modal';
import QueryResultTable from './QueryResultTable';

const QueryManager = ({ clientType }) => {
  const [queries, setQueries] = useState([]);
  const [queryName, setQueryName] = useState('');
  const [queryText, setQueryText] = useState('SELECT id, "name" FROM public.test'); // Hardcoded query
  const [queryResult, setQueryResult] = useState(null);
  const [error, setError] = useState(null);
  const [editingQuery, setEditingQuery] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    const savedQueries = await window.electron.loadConnectionDetails(`${clientType}-queries`);
    console.log(`Loaded queries for ${clientType}:`, savedQueries);
    setQueries(savedQueries || []);
  };

  const sanitizeInput = (input) => {
    // Basic sanitization to prevent SQL injection and XSS attacks
    return input.replace(/<[^>]+>|--|\/\*|\*\/|;|'/g, '');
  };

  const saveQuery = async () => {
    if (!queryName || !queryText) {
      setError('Query name and text cannot be empty.');
      return;
    }

    const sanitizedQueryName = sanitizeInput(queryName);
    const sanitizedQueryText = sanitizeInput(queryText);

    // Basic validation to check for incomplete SQL statements
    if (sanitizedQueryText.trim().endsWith("WHERE") || sanitizedQueryText.trim().endsWith("AND") || sanitizedQueryText.trim().endsWith("OR")) {
      setError('Query text appears to be incomplete.');
      return;
    }

    const newQuery = { name: sanitizedQueryName, text: sanitizedQueryText };
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
    setShowForm(false);
    setIsModalOpen(false);
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

      const sanitizedQueryText = sanitizeInput(query.text);

      // Basic validation to check for incomplete SQL statements
      if (sanitizedQueryText.trim().endsWith("WHERE") || sanitizedQueryText.trim().endsWith("AND") || sanitizedQueryText.trim().endsWith("OR")) {
        setError('Query text appears to be incomplete.');
        return;
      }

      console.log(`Executing Query: ${sanitizedQueryText}`);
      const result = await window.electron.executeQuery({
        clientType,
        query: sanitizedQueryText,
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
    setShowForm(true);
    setIsModalOpen(true);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="ml-10 w-full grid grid-cols-1 gap-4 margin-top-70">
      <div>
        <div className="flex-1">
        <h2 className="text-xl font-bold">Manage Queries</h2>
        {error && <div className="text-red-600">{error}</div>}
        <button
          onClick={() => setShowForm(!showForm)}
          className="mb-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <AiOutlinePlus className="mr-2" />
          Create New Query
        </button>
        {showForm && (
          <>
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
              <CodeMirror
                value={queryText}
                height="200px"
                extensions={[sql()]}
                onChange={(value) => setQueryText(value)}
                theme={dracula}
              />
            </div>
            <button
              onClick={openModal}
              className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <AiOutlineExpand className="mr-2" />
              Expand Editor
            </button>
            <button
              onClick={saveQuery}
              className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {editingQuery ? 'Update Query' : 'Save Query'}
            </button>
          </>
        )}
        </div>
        <div className="">
        <h3 className="text-lg font-semibold mt-6">Saved Queries</h3>
        <ul className="space-y-2">
          {queries.map((query) => (
            <li key={query.name} className="flex justify-between items-center p-2 border border-gray-300 rounded-md">
              <span>{query.name}</span>
              <div>
                <button
                  onClick={() => executeQuery(query)}
                  className="inline-flex overflow-hidden text-white bg-gray-700 rounded group h-8 mr-5"
                >
                  <span className="h-full px-2 py-2 text-white bg-gray-600 group-hover:bg-purple-600 flex items-center justify-center">
                    <AiOutlinePlaySquare className="mr-2" />
                  </span>
                  <span className="pl-3 pr-4 py-1 text-center">Execute</span>
                </button>
                <button
                  onClick={() => editQuery(query)}
                  className="inline-flex overflow-hidden text-white bg-gray-700 rounded group h-8 mr-5"
                >
                  <span className="h-full px-2 py-2 text-white bg-gray-600 group-hover:bg-purple-600 flex items```jsx
                  justify-center">
                    <AiOutlineEdit className="mr-2" />
                  </span>
                  <span className="pl-3 pr-4 py-1 text-center">Edit</span>
                </button>
                <button
                  onClick={() => deleteQuery(query)}
                  className="inline-flex overflow-hidden text-white bg-gray-700 rounded group h-8 mr-5"
                >
                  <span className="h-full px-2 py-2 text-white bg-red-400 group-hover:bg-red-500 flex items-center justify-center">
                    <AiOutlineDelete className="mr-2" />
                  </span>
                  <span className="pl-3 pr-4 py-1 text-center">Delete</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
        </div>
      </div>
      <div>
        <QueryResultTable queryResult={queryResult} />
      </div>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Query Editor"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h2 className="text-xl font-bold">Edit Query</h2>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Query Name</label>
          <input
            type="text"
            value={queryName}
            onChange={(e) => setQueryName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
          />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Query Text</label>
          <CodeMirror
            value={queryText}
            height="500px"
            extensions={[sql()]}
            onChange={(value) => setQueryText(value)}
            theme={dracula}
          />
        </div>
        <div className="mt-4">
          <button
            onClick={saveQuery}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {editingQuery ? 'Update Query' : 'Save Query'}
          </button>
          <button
            onClick={closeModal}
            className="w-full inline-flex justify-center py-2 px-4 mt-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default QueryManager;
