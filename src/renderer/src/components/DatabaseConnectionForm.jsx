import React, { useState, useEffect } from 'react';
import { AiOutlineLink, AiOutlineUser, AiOutlineNumber, AiOutlineSave, AiOutlineLeft, AiOutlineRight } from 'react-icons/ai'; // Import icons from react-icons

const DatabaseConnectionForm = ({ clientType, onSave }) => {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [database, setDatabase] = useState('');
  const [databases, setDatabases] = useState([]);
  const [isFormVisible, setIsFormVisible] = useState(false); // State to manage form visibility

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
    if (typeof onSave === 'function') {
      onSave(connectionDetails);
    } else {
      console.error('onSave is not a function');
    }
  };


  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
  };

  return (
    <div className="ml-10 mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-medium text-gray-700"></h2>
        <button
          onClick={toggleFormVisibility}
          className="text-gray-700 focus:outline-none  bg-slate-100 p-2 rounded ConnectionArrow"
        >
          {isFormVisible ? <AiOutlineLeft className="h-4 w-4" /> : <AiOutlineRight className="h-4 w-4" />}
        </button>
      </div>
      {isFormVisible && (
        <form onSubmit={handleSave} className="space-y-4">
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
            <input
              type="text"
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
            />
          </div>
          <div className='flex grid-cols-2'>
            <button
              type="submit"
              className="inline-flex overflow-hidden text-white bg-gray-700 rounded group h-8 mr-5"
            >
              <span className="h-full px-2 py-2 text-white bg-green-500 group-hover:bg-green-600 flex items-center justify-center">
                <AiOutlineSave className="mr-2" />
              </span>
              <span className="pl-3 pr-4 py-1 text-center">Save</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DatabaseConnectionForm;
