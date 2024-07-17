import React from 'react';

const TableViewer = ({ data, renderPlayButton }) => {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {Object.keys(data[0]).map((key) => (
            <th
              key={key}
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              {key}
            </th>
          ))}
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Action
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {data.map((row, index) => (
          <tr key={`${row["Round ID"]}-${index}`}>
            {Object.keys(row).map((key) => (
              <td key={`${key}-${index}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {row[key]}
              </td>
            ))}
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {renderPlayButton(`${row["Round ID"]}-${index}`)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TableViewer;
