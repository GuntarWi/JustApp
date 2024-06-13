import React, { useEffect, useState } from 'react';

const DatabaseSelector = ({ onSelectDatabase }) => {
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState('');

  useEffect(() => {
    const fetchDatabases = async () => {
      try {
        const dbList = await window.electron.invoke('get-databases');
        setDatabases(dbList);
      } catch (error) {
        console.error('Error fetching databases:', error);
      }
    };

    fetchDatabases();
  }, []);

  const handleDatabaseSelect = (event) => {
    const database = event.target.value;
    setSelectedDatabase(database);
    onSelectDatabase(database);
  };

  return (
    <div>
      <h2>Select Database</h2>
      <select value={selectedDatabase} onChange={handleDatabaseSelect}>
        <option value="">Select a database</option>
        {databases.map((db) => (
          <option key={db} value={db}>{db}</option>
        ))}
      </select>
    </div>
  );
};

export default DatabaseSelector;
    