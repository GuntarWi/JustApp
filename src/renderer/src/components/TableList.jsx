import React, { useEffect, useState } from 'react';
import { SiPostgresql } from "react-icons/si";
import { GiPlainCircle } from "react-icons/gi";
import { TbDatabase } from "react-icons/tb";
import { CiViewTable } from "react-icons/ci";

const TableList = ({ clientType }) => {
  const [tables, setTables] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Connection...');
  const [isConnected, setIsConnected] = useState(null);

  useEffect(() => {
    const testConnectionAndFetchTables = async () => {
      try {
        const connectionResult = await window.electron.testConnection(clientType);
        setIsConnected(connectionResult);
        
        if (connectionResult) {
          setConnectionStatus('Connection successful');
          const fetchedTables = await window.electron.getTables(clientType);
          setTables(fetchedTables);
        } else {
          setConnectionStatus('Connection failed');
        }
      } catch (error) {
        console.error('Error:', error);
        setConnectionStatus('Connection failed');
        setIsConnected(false);
      }
    };

    testConnectionAndFetchTables();
  }, [clientType]);

  return (
    <div className="">
      <div className="pl-3 pt-5 w-32 flex items-center">
        <SiPostgresql className="p-1 text-white bg-sky-800 rounded-md w-8 h-5" />
        {isConnected === null ? (
          
          <GiPlainCircle className="border-2 p-0 rounded-full border-white text-gray-500 w-6 relative -top-2 -left-2" />
        ) : isConnected ? (
          <GiPlainCircle className="border-2 p-0 rounded-full border-white text-green-500 w-6 relative -top-2 -left-2" />
        ) : (
          <GiPlainCircle className="border-2 p-0 rounded-full border-white text-red-500 w-6 relative -top-2 -left-2" />
        )}
        <h3 className="pl-1 text-xs">{connectionStatus}</h3>
      </div>
      <div >
        <div className="pl-2 pt-5 flex justify-start">
          <TbDatabase className="mt-0.5" />
          <h3 className="pl-1 pt-0.5 text-sm text-black">Available Tables</h3>
        </div>
        <ul className="pl-6 pt-3 text-xs">
          {tables.map((table, index) => (
            <li key={index} className="flex items-center mt-0.5">
              <CiViewTable className="pr-1 w-6" />
              {table}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TableList;
