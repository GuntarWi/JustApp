import React, { useState, useEffect } from 'react';
import TableViewer from '../components/TableViewer';
import { AiOutlinePlayCircle } from "react-icons/ai";

const Player = ({ clientType }) => {
  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [trueCounts, setTrueCounts] = useState({});

  useEffect(() => {
    const loadQueries = async () => {
      const savedQueries = await window.electron.getConfig(`${clientType}-queries`);
      setQueries(savedQueries || []);
      const defaultQuery = savedQueries.find(query => query.name === 'Player');
      if (defaultQuery) {
        setSelectedQuery(defaultQuery.text);
      }
    };
    loadQueries();
  }, [clientType]);

  const executeQuery = async () => {
    try {
      setQueryResult(null); // Clear the table before executing a new query
      let queryText = selectedQuery;
      if (playerId) {
        queryText += ` WHERE "User Id" = '${playerId}'`;
      }
      const result = await window.electron.executeQuery({
        clientType,
        query: queryText,
      });
      setQueryResult(result);
    } catch (error) {
      console.error('Query Execution Error:', error);
    }
  };

  const fetchAndComputeTrueCounts = async () => {
    if (!queryResult) return;

    try {
      const roundIds = [...new Set(queryResult.map(row => row["gameid"]))];

      const shoeIdQuery = `
        SELECT DISTINCT "gameid", "Shoe change time"
        FROM public.fraud_bj_view
        WHERE "gameid" IN (${roundIds.map(id => `'${id}'`).join(', ')})
      `;
      const shoeIdResult = await window.electron.executeQuery({
        clientType,
        query: shoeIdQuery,
      });

      if (!shoeIdResult || shoeIdResult.length === 0) {
        console.error('No shoe IDs found for the gameids');
        return;
      }

      const shoeIdMap = {};
      shoeIdResult.forEach(row => {
        shoeIdMap[row["gameid"]] = row["Shoe change time"];
      });

      const shoeIds = [...new Set(shoeIdResult.map(row => row["Shoe change time"]))];

      const cardsQuery = `
        SELECT "gameid", cards, "Shoe change time"
        FROM public.fraud_bj_view
        WHERE "Shoe change time" IN (${shoeIds.map(id => `'${id}'`).join(', ')})
        ORDER BY "Time"
      `;
      const cardsResult = await window.electron.executeQuery({
        clientType,
        query: cardsQuery,
      });

      if (!cardsResult || cardsResult.length === 0) {
        console.error('No cards found for the shoe IDs');
        return;
      }

      const roundCards = {};
      cardsResult.forEach(row => {
        if (!roundCards[row["gameid"]]) {
          roundCards[row["gameid"]] = [];
        }
        roundCards[row["gameid"]].push({ card: row.cards, shoe: row["Shoe change time"] });
      });

      const trueCountsToUpdate = {};
      let runningCount = 0;
      let currentShoe = null;
      let cardCount = 0;

      Object.keys(roundCards).forEach(rid => {
        roundCards[rid].forEach(({ card, shoe }) => {
          if (currentShoe !== shoe) {
            runningCount = 0; // Reset running count when the shoe changes
            cardCount = 0; // Reset card count when the shoe changes
            currentShoe = shoe;
          }
          runningCount += calculateRunningCount([card]);
          cardCount += 1;
        });

        const decksRemaining = (416 - cardCount) / 52; // 416 cards = 8 decks
        trueCountsToUpdate[rid] = Math.round((runningCount / decksRemaining) * 10) / 10;
      });

      setTrueCounts(prevState => ({
        ...prevState,
        ...trueCountsToUpdate,
      }));
    } catch (error) {
      console.error('Error computing true count:', error);
    }
  };

  const calculateRunningCount = (cards) => {
    const cardValues = {
      '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
      '7': 0, '8': 0, '9': 0,
      '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1,
    };

    let runningCount = 0;
    cards.forEach(card => {
      const cardRank = card[0]; // Extract rank from 'Qs8' format (only the first character)
      runningCount += cardValues[cardRank] || 0;
    });

    return runningCount;
  };

  return (
    <div className="space-y-4 flex">
      <div className='mr-5 ml-5'>
        <h2 className="text-xl font-bold">Player</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">Player ID</label>
          <input
            type="text"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Query</label>
          <select
            value={selectedQuery}
            onChange={(e) => setSelectedQuery(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
          >
            <option value="">Select a query</option>
            {queries.map((query) => (
              <option key={query.name} value={query.text}>{query.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={executeQuery}
          className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Execute Query
        </button>
        {queryResult && (
          <button
            onClick={fetchAndComputeTrueCounts}
            className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Compute True Counts for All Rounds
          </button>
        )}
      </div>
      <div className='grow order-first'>
        {queryResult && (
          <TableViewer
            data={queryResult}
            renderPlayButton={(uniqueId) => (
              trueCounts[uniqueId.split('-')[0]] !== undefined ? (
                <span>{trueCounts[uniqueId.split('-')[0]]}</span>
              ) : (
                <button onClick={() => fetchAndComputeTrueCounts(uniqueId.split('-')[0])}>
                  <AiOutlinePlayCircle />
                </button>
              )
            )}
          />
        )}
      </div>
    </div>
  );
};

export default Player;
