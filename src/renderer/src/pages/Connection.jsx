// src/renderer/src/pages/Connection.jsx
import React from 'react';
import DatabaseConnectionForm from '../components/DatabaseConnectionForm';
import QueryManager from '../components/QueryManager';
import TableViewer from '../components/TableViewer';

const Connection = ({ clientType }) => {
  return (
    <div className="flex flex-col md:flex-row md:space-x-4 w-full">
      <div className="basis-1/4">
        <DatabaseConnectionForm clientType={clientType} />
      </div>
      <div className="basis-1/1">
        <QueryManager clientType={clientType} />
      </div>

    </div>
  );
};

export default Connection;
