import React from 'react';
import { MaterialReactTable } from 'material-react-table'; // Import the named export

const QueryResultTable = ({ queryResult }) => {
  if (!queryResult || !queryResult.length) {
    return <p>No data available.</p>;
  }

  const columns = Object.keys(queryResult[0]).map((key) => ({
    accessorKey: key,
    header: key,
  }));

  return (
    <div>
      <MaterialReactTable
        columns={columns}
        data={queryResult}
        enableColumnResizing
        enableColumnReordering
      />
    </div>
  );
};

export default QueryResultTable;
