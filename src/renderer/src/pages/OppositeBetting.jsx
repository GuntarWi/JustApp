import React, { useState, useEffect } from 'react';
import OppositeBettingTableViewer from '../components/OppositeBettingTableViewer';

const OppositeBetting = ({ clientType }) => {
  const [queries, setQueries] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState('');
  const [queryResult, setQueryResult] = useState([]);
  const [playerIds, setPlayerIds] = useState('');
  const [bankerTotal, setBankerTotal] = useState(0);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [finding, setFinding] = useState(false);
  const [shouldStop, setShouldStop] = useState(false);

  useEffect(() => {
    const loadQueries = async () => {
      const savedQueries = await window.electron.getConfig(`${clientType}-queries`);
      setQueries(savedQueries || []);
      const defaultQuery = savedQueries.find(query => query.name === 'OppositeBetting');
      if (defaultQuery) {
        setSelectedQuery(defaultQuery.text);
      }
    };
    loadQueries();
  }, [clientType]);

  const executeQuery = async () => {
    try {
      setLoading(true);
      setQueryResult([]); // Clear the table before executing a new query
      const playerIdsArray = playerIds.split(',').map(id => id.trim());
      let queryText = selectedQuery;
      if (playerIdsArray.length > 0) {
        queryText += ` WHERE "User Id" IN (${playerIdsArray.map(id => `'${id}'`).join(', ')})`;
      }
      const result = await window.electron.executeQuery({
        clientType,
        query: queryText,
      });
      setQueryResult(result);
    } catch (error) {
      console.error('Query Execution Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const findOppositeBets = async () => {
    if (queryResult.length === 0) return;

    setFinding(true);
    setShouldStop(false);
    const playerIdsSet = new Set(playerIds.split(',').map(id => id.trim()));
    const processedRounds = new Set();
    let updatedQueryResult = [...queryResult];
    let bankerSum = 0;
    let playerSum = 0;
    const playerRoundCount = {};

    const processRound = async (roundId) => {
      if (shouldStop || processedRounds.has(roundId)) return;
      processedRounds.add(roundId);

      const queryText = `
        SELECT *
        FROM public.fraud_round_history
        WHERE "Round ID" = '${roundId}'
      `;
      const roundBets = await window.electron.executeQuery({
        clientType,
        query: queryText,
      });

      const bankerBets = roundBets.filter(bet => bet["Bet Position"] === 'BANKER');
      const playerBets = roundBets.filter(bet => bet["Bet Position"] === 'PLAYER');

      bankerSum += bankerBets.reduce((sum, bet) => sum + parseFloat(bet["BET EUR"].replace(/,/g, '')), 0);
      playerSum += playerBets.reduce((sum, bet) => sum + parseFloat(bet["BET EUR"].replace(/,/g, '')), 0);

      const appendBet = (bet, existingPlayerIds) => {
        if (!existingPlayerIds.has(bet["User Id"])) {
          const roundIndex = updatedQueryResult.findIndex(item => item['Round ID'] === roundId);
          if (roundIndex !== -1) {
            updatedQueryResult.splice(roundIndex + 1, 0, bet);
            existingPlayerIds.add(bet["User Id"]);
          }
        }
      };

      const existingPlayerIds = new Set(updatedQueryResult.filter(item => item['Round ID'] === roundId).map(item => item['User Id']));

      bankerBets.forEach(bankerBet => {
        playerBets.forEach(playerBet => {
          const bankerAmount = parseFloat(bankerBet["BET EUR"].replace(/,/g, ''));
          const playerAmount = parseFloat(playerBet["BET EUR"].replace(/,/g, ''));
          const deviation = Math.abs(bankerAmount - playerAmount) / Math.max(bankerAmount, playerAmount);

          if (bankerAmount === playerAmount || deviation <= 0.1) { // Using 10% deviation
            if (!playerIdsSet.has(playerBet["User Id"])) {
              playerIdsSet.add(playerBet["User Id"]);
              setPlayerIds([...playerIdsSet].join(', '));
            }

            // Append player bet under the corresponding round ID
            appendBet(playerBet, existingPlayerIds);

            // Track the round count for the player
            playerRoundCount[playerBet["User Id"]] = (playerRoundCount[playerBet["User Id"]] || 0) + 1;
          }
        });
      });

      // Process new opposite betting rounds
      const newRounds = roundBets.map(bet => bet['Round ID']).filter(rid => !processedRounds.has(rid));
      for (const newRoundId of newRounds) {
        await processRound(newRoundId);
      }
    };

    const initialRounds = [...new Set(queryResult.map(row => row["Round ID"]))];
    for (const roundId of initialRounds) {
      await processRound(roundId);
    }

    // Exclude players who do not form a chain of opposite bets
    const filteredQueryResult = updatedQueryResult.filter(row => {
      const playerId = row['User Id'];
      return playerRoundCount[playerId] >= 2; // Adjust the threshold as needed
    });

    setQueryResult(filteredQueryResult);
    setBankerTotal(bankerSum);
    setPlayerTotal(playerSum);
    setFinding(false);
  };

  const stopFinding = () => {
    setShouldStop(true);
  };

  useEffect(() => {
    console.log('Updated Query Result:', queryResult);
  }, [queryResult]);

  return (
    <div className="space-y-4 flex">
      <div className='mr-5 ml-5'>
        <h2 className="text-xl font-bold">Opposite Betting</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">User Ids (comma separated)</label>
          <input
            type="text"
            value={playerIds}
            onChange={(e) => setPlayerIds(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
          />
        </div>
        <button
          onClick={executeQuery}
          className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          disabled={loading}
        >
          {loading ? 'Fetching...' : 'Fetch Results'}
        </button>
        {queryResult.length > 0 && !finding && (
          <button
            onClick={findOppositeBets}
            className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Find Opposite Bets
          </button>
        )}
        {finding && (
          <button
            onClick={stopFinding}
            className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Stop
          </button>
        )}
      </div>
      <div className='grow order-first'>
        {queryResult.length > 0 && (
          <>
            <OppositeBettingTableViewer data={queryResult} />
            {bankerTotal > 0 && playerTotal > 0 && (
              <div>
                <h3 className="text-lg font-semibold mt-6">Opposite Betting Rounds</h3>
                <p>Total BET EUR on Banker: {bankerTotal}</p>
                <p>Total BET EUR on Player: {playerTotal}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OppositeBetting;
