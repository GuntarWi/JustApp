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
        <button
          onClick={toggleFormVisibility}
          className="text-gray-700 focus:outline-none  bg-slate-100 p-2 rounded ConnectionArrow"
        >
          {isFormVisible ? <AiOutlineLeft className="h-4 w-4" /> : <AiOutlineRight className="h-4 w-4" />}
        </button>
      </div>
      
      {isFormVisible && (
        
        <form onSubmit={handleSave} className="space-y-4">
                <h2 className="text-xl font-medium text-gray-700 uppercase">Connection</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 uppercase">Host</label>
            <div className="relative">
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="mt-1 block w-72 px-3 py-2 pl-10 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AiOutlineLink className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 uppercase">Port</label>
            <div className="relative">
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="mt-1 block w-full px-3 py-2 pl-10 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AiOutlineNumber className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 uppercase">User</label>
            <div className="relative">
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="mt-1 block w-full px-3 py-2 pl-10 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AiOutlineUser className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 uppercase">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 pl-10 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AiOutlineSave className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 uppercase">Database</label>
            <div className="relative">
              <input
                type="text"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                className="mt-1 block w-full px-3 py-2 pl-10 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <AiOutlineSave className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="flex col-1">
            <button
              type="submit"
              className="border-0 border-slate-100 inline-flex overflow-hidden text-gray-700 bg-gray-100 rounded group h-8 w-full"
            >
              <span className="h-full px-2 py-2 text-white bg-green-500 group-hover:bg-green-600 flex items-center justify-center">
                <AiOutlineSave className="mr-2" />
              </span>
              <span className=" py-1 text-center justify-center w-full uppercase">Save</span>
            </button>
          </div>
        </form>
      )}  
    </div>
  );
};

export default DatabaseConnectionForm;
