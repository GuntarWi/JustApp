import React, { useState, useEffect } from 'react';
import { AiOutlineLink, AiOutlineUser, AiOutlineNumber,AiOutlineSave   } from 'react-icons/ai'; // Import icons from react-icons
const DatabaseConnectionForm = ({ clientType, onSave }) => {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('');
  const [databases, setDatabases] = useState([]);

  useEffect(() => {
    const loadConnectionDetails = async () => {
      const details = await window.electron.loadConnectionDetails(clientType);
      if (details) {
        setHost(details.host || '');
        setPort(details.port || '');
        setUser(details.user || '');
        setPassword(details.password || '');
        setDatabase(details.database || '');
      }
    };

    loadConnectionDetails();
  }, [clientType]);

  const handleSave = async (event) => {
    event.preventDefault();
    const connectionDetails = { host, port, user, password, database };
    await window.electron.saveConnectionDetails(clientType, connectionDetails);
    onSave(connectionDetails); // This line is causing the error
  };

  const handleTestConnection = async () => {
    const connectionDetails = { host, port, user, password };
    const fetchedDatabases = await window.electron.getDatabases(connectionDetails);
    setDatabases(fetchedDatabases);
  };

  return (
    <form onSubmit={handleSave} className="ml-10 mt-10 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Host</label>
        <input
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Port</label>
        <input
          type="text"
          value={port}
          onChange={(e) => setPort(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">User</label>
        <input
          type="text"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Database</label>
        <select
          value={database}
          onChange={(e) => setDatabase(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
        >
          {databases.map(db => (
            <option key={db} value={db}>{db}</option>
          ))}
        </select>
      </div>
      <div className='flex grid-cols-2'>
      <button
              type="submit"
              className="inline-flex overflow-hidden text-white bg-gray-700 rounded group h-8 mr-5"
            >
              <span className="h-full px-2 py-2 text-white bg-green-500 group-hover:bg-green-600 flex items-center justify-center">
              <AiOutlineSave  className="mr-2" />

              </span>
              <span className="pl-3 pr-4 py-1 text-center">Save</span>
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              className=" inline-flex overflow-hidden text-white bg-gray-700 rounded group h-8"
            >

              <span className="h-full px-2 py-2 text-white bg-gray-600 group-hover:bg-purple-600 flex items-center justify-center">
              <AiOutlineLink className="mr-2" />

              </span>
              <span className="pl-3 pr-4 py-1 text-center">Fetch Databases</span>
            </button>
      </div>
    </form>
  );
};

export default DatabaseConnectionForm;
