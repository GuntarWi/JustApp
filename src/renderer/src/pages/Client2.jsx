// src/renderer/src/pages/Client2.jsx
import React from 'react';
import TableViewer from '../components/TableViewer';

const Client2 = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Client 2</h1>
      <TableViewer clientType="client2" />
    </div>
  );
};

export default Client2;
