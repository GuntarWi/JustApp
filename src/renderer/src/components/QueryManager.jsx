import React, { useState, useEffect } from 'react';
import { AiOutlinePlaySquare, AiOutlineEdit, AiOutlineDelete, AiOutlinePlus, AiOutlineExpand } from "react-icons/ai";
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { dracula } from '@uiw/codemirror-theme-dracula';
import Modal from 'react-modal';
import QueryResultTable from './QueryResultTable';
import IconButton from "./IconButton";
import { TbMinus, TbCircleX } from "react-icons/tb";
import QueryCard from "./UI/QueryCard";

const QueryManager = ({ clientType }) => {
  const [queries, setQueries] = useState([]);
  const [queryName, setQueryName] = useState('');
  const [queryText, setQueryText] = useState('SELECT id, "name" FROM public.test'); // Hardcoded query
  const [queryResult, setQueryResult] = useState(null);
  const [error, setError] = useState(null);
  const [editingQuery, setEditingQuery] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false); // State for result modal

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
    return input.replace(/<[^>]+>|--|\/\*|\*\/|;/g, '');
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

    const newQuery = { name: sanitizedQueryName, text: sanitizedQueryText, createdAt: new Date().toISOString() };
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
      //console.log('Query Result:', result);
      setQueryResult(result);
      setError(null);
      setIsResultModalOpen(true); // Open result modal on success
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
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const closeResultModal = () => setIsResultModalOpen(false); // Close result modal

  return (
    <div className="ml-10 w-full grid grid-cols-1 gap-4 mt-10">
      <div>
        <div className="flex-1 max-w-lg">
          <h2 className="text-xl font-medium text-gray-700 uppercase mb-9">Manage Queries</h2>
          {error && <div className="text-red-600">{error}</div>}
          {showForm ? 
            <IconButton
              icon={TbMinus}
              label="Hide"
              onClick={() => setShowForm(!showForm)}
              svgClassName="bold-icon-1"
              btnClassName="button-violet"
            /> : 
            <IconButton
              icon={AiOutlinePlus}
              label="Create"
              onClick={() => setShowForm(!showForm)}
              svgClassName="bold-icon"
              btnClassName="button-green"
            />
          }

          {showForm && (
            <>
              <div className="mb-5 mt-5">
                <label className="block text-sm font-medium text-gray-700">Query Name</label>
                <input
                  type="text"
                  value={queryName}
                  onChange={(e) => setQueryName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
                />
              </div>
              <div>
                <CodeMirror
                  value={queryText}
                  height="200px"
                  extensions={[sql()]}
                  onChange={(value) => setQueryText(value)}
                  theme={dracula}
                />
              </div>
              <div className="flex space-x-4 mt-5">
                <IconButton
                  icon={AiOutlineExpand}
                  label="Expand"
                  onClick={openModal}
                  svgClassName="bold-icon"
                  btnClassName="button-blue"
                />

                <IconButton
                  icon={AiOutlinePlus}
                  label={editingQuery ? 'Update' : 'Save'}
                  onClick={saveQuery}
                  svgClassName="bold-icon"
                  btnClassName="button-green"
                />
              </div>
            </>
          )}
        </div>
        <div className="">
          <h3 className="text-lg font-semibold mt-6">Saved Queries</h3>
          <ul className="space-y-2 max-h-full flex flex-wrap overflow-y-scroll">
            {queries.map((query) => (
              <li key={query.name} className="flex justify-between items-center p-2 min-w-72">
                <QueryCard
                  notificationTitle={query.name}
                  messageAuthor={clientType}
                  messageText="Liked your Query"
                  timeAgo={query.createdAt}
                  executeQuery={executeQuery}
                  editQuery={editQuery}
                  deleteQuery={deleteQuery}
                  query={query}
                />
                <div>
                </div>
              </li>
            ))}
          </ul>
        </div>
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
          <div className="mt-4 flex space-x-4">
            <IconButton
              icon={AiOutlinePlus}
              label={editingQuery ? 'Update' : 'Save'}
              onClick={saveQuery}
              svgClassName="bold-icon"
              btnClassName="button-green"
            />

            <IconButton
              icon={TbCircleX}
              label="Close"
              onClick={closeModal}
              btnClassName="button-red"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isResultModalOpen}
        onRequestClose={closeResultModal}
        contentLabel="Query Result"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h2 className="text-xl font-bold">Query Result</h2>
        <div className="mt-4">
          <QueryResultTable queryResult={queryResult} />
        </div>
        <div className="mt-4 flex space-x-4">
          <IconButton
            icon={TbCircleX}
            label="Close"
            onClick={closeResultModal}
            btnClassName="button-red"
          />
        </div>
      </Modal>
    </div>
  );
};

export default QueryManager;
