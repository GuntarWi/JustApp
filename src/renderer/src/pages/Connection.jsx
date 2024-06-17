// src/renderer/src/pages/Connection.jsx
import React from 'react';
import DatabaseConnectionForm from '../components/DatabaseConnectionForm';
import QueryManager from '../components/QueryManager';
import TableViewer from '../components/TableViewer';
import TableList from '../components/TableList';


const Connection = ({ clientType }) => {
  return (
    <div className="flex w-full">
      <div className="grid-cols-1 text-wrap">
      <TableList className=""key={clientType} clientType={clientType} />
      </div>
      <div className="grid-cols-1">
    
      <DatabaseConnectionForm clientType={clientType} onSave={(details) => console.log('Connection details saved!', details)} />
      </div>
      <div className="grid-cols-1">
        <QueryManager clientType={clientType} />
        
      </div>

    </div>
  );
};

export default Connection;
