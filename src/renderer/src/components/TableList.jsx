import React, { useEffect, useState } from 'react';
import { SiPostgresql } from "react-icons/si";
import { GiPlainCircle } from "react-icons/gi";
import { TbDatabase } from "react-icons/tb";
import { TbTableColumn } from "react-icons/tb";
import { TbAxisX } from "react-icons/tb";

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
          setConnectionStatus('Connected');
          const fetchedTables = await window.electron.getTables(clientType);
          setTables(fetchedTables);
        } else {
          setConnectionStatus('Disconnected');
        }
      } catch (error) {
        console.error('Error:', error);
        setConnectionStatus('Disconnected');
        setIsConnected(false);
      }
    };

    testConnectionAndFetchTables();
  }, [clientType]);

  return (
    <div className="mt-5">
      <div className="pl-3 flex items-center">
        <SiPostgresql className="p-1 text-white bg-sky-800 rounded-md w-5 h-5" />
        {isConnected === null ? (
          
          <GiPlainCircle className="border-2 rounded-full border-white text-gray-500 w-3 h-3 relative -top-2 -left-1.5" />
        ) : isConnected ? (
          <GiPlainCircle className="border-2 rounded-full border-white text-green-500 w-3 h-3 relative -top-2 -left-1.5" />
        ) : (
          <GiPlainCircle className="border-2 rounded-full border-white text-red-500 w-3 h-3 relative -top-2 -left-1.5" />
        )}
        <h3 className="text-xs">{connectionStatus}</h3>
      </div>
      <div >
        <div className="pl-2 mt-5 flex justify-start">
          <TbDatabase className="h-5 mt-0.5" />
          <h3 className="pl-1 pt-0.5 text-sm text-black">Available Tables</h3>
        </div>
        <ul className="pl-3 pt-3 text-ms">
          {tables.map((table, index) => (
            <li key={index} className="flex mr-5 items-center mt-0.5">
              <TbAxisX  className="ml-1"/>
              <TbTableColumn  className="mr-1 ml-0.5"/>
              {table}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TableList;
