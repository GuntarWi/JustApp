import React, { useState, useEffect, useCallback } from 'react';
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
  const [playerStats, setPlayerStats] = useState([]);

  const BET_POSITION = "Bet Position"; // Adjust if database field changes
  const BET_POSITION_PLAYER = "PLAYER"; // Adjust if database field changes
  const BET_POSITION_BANKER = "BANKER"; // Adjust if database field changes
  const BET_EUR = "BET EUR"; // Adjust if database field changes
  const GAME_ID = "Game Id"; // Adjust if database field changes
  const USER_ID = "User Id"; // Adjust if database field changes

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
      setQueryResult([]);
      const playerIdsArray = playerIds.split(',').map(id => id.trim());
      let queryText = selectedQuery;
      if (playerIdsArray.length > 0) {
        queryText += ` WHERE "${USER_ID}" IN (${playerIdsArray.map(id => `'${id}'`).join(', ')})`;
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

  const findOppositeBets = useCallback(async () => {
    if (queryResult.length === 0) return;

    console.clear();
    setFinding(true);
    setShouldStop(false);
    const detectedPlayerIds = new Set();
    const playerRoundStats = {};
    const processedRounds = new Set();
    const processedPlayerRoundPairs = new Set();
    let newQueryResult = [];
    let bankerSum = 0;
    let playerSum = 0;

    const parseBetAmount = (bet) => {
      return typeof bet[BET_EUR] === 'string'
        ? parseFloat(bet[BET_EUR].replace(/,/g, ''))
        : bet[BET_EUR];
    };

    const updatePlayerStats = (userId, isOpposite, amount, roundId) => {
      if (!playerRoundStats[userId]) {
        playerRoundStats[userId] = {
          totalRounds: new Set(),
          oppositeRounds: new Set(),
          oppositeWager: 0,
          nonOppositeWager: 0,
        };
      }
      playerRoundStats[userId].totalRounds.add(roundId);
      if (isOpposite) {
        playerRoundStats[userId].oppositeRounds.add(roundId);
        playerRoundStats[userId].oppositeWager += amount;
      } else {
        playerRoundStats[userId].nonOppositeWager += amount;
      }
    };

    const processRound = async (roundId) => {
      if (shouldStop || processedRounds.has(roundId)) return;
      processedRounds.add(roundId);

      const queryText = `
        SELECT *
        FROM public.fraud_round_history
        WHERE "${GAME_ID}" = '${roundId}'
      `;
      const roundBets = await window.electron.executeQuery({
        clientType,
        query: queryText,
      });

      console.log(`Processing Round: ${roundId}`);

      const bankerBets = roundBets.filter(bet => bet[BET_POSITION] === BET_POSITION_BANKER);
      const playerBets = roundBets.filter(bet => bet[BET_POSITION] === BET_POSITION_PLAYER);

      console.log(`Banker Bets: ${JSON.stringify(bankerBets)}`);
      console.log(`Player Bets: ${JSON.stringify(playerBets)}`);

      bankerSum += bankerBets.reduce((sum, bet) => sum + parseBetAmount(bet), 0);
      playerSum += playerBets.reduce((sum, bet) => sum + parseBetAmount(bet), 0);

      const oppositeBets = [];

      // Function to check if bets are opposite
      const checkOppositeBets = (bankerGroup, playerGroup) => {
        const bankerTotal = bankerGroup.reduce((sum, bet) => sum + parseBetAmount(bet), 0);
        const playerTotal = playerGroup.reduce((sum, bet) => sum + parseBetAmount(bet), 0);
        const deviation = Math.abs(bankerTotal - playerTotal) / Math.max(bankerTotal, playerTotal);

        console.log(`Round: ${roundId}, Banker Total: ${bankerTotal}, Player Total: ${playerTotal}, Deviation: ${deviation}`);

        if (bankerTotal === playerTotal || deviation <= 0.05) {
          console.log(`Opposite Betting Detected: Round: ${roundId}`);
          console.log(`Banker Group: ${bankerGroup.map(bet => bet[USER_ID]).join(', ')}`);
          console.log(`Player Group: ${playerGroup.map(bet => bet[USER_ID]).join(', ')}`);
          bankerGroup.concat(playerGroup).forEach(bet => {
            const playerRoundKey = `${bet[USER_ID]}-${bet[GAME_ID]}`;
            if (!processedPlayerRoundPairs.has(playerRoundKey)) {
              processedPlayerRoundPairs.add(playerRoundKey);
              oppositeBets.push(bet);
              detectedPlayerIds.add(bet[USER_ID]);
              updatePlayerStats(bet[USER_ID], true, parseBetAmount(bet), roundId);
            }
          });
        } else {
          bankerGroup.concat(playerGroup).forEach(bet => {
            updatePlayerStats(bet[USER_ID], false, parseBetAmount(bet), roundId);
          });
        }
      };

      // Check individual bets
      bankerBets.forEach(bankerBet => {
        playerBets.forEach(playerBet => {
          checkOppositeBets([bankerBet], [playerBet]);
        });
      });

      // Check group bets
      const checkGroupBets = (mainBets, oppositeBets) => {
        for (let i = 0; i < mainBets.length; i++) {
          let mainGroup = [mainBets[i]];
          let oppositeGroup = [];
          let oppositeTotal = 0;
          const mainTotal = parseBetAmount(mainBets[i]);

          for (let j = 0; j < oppositeBets.length; j++) {
            oppositeTotal += parseBetAmount(oppositeBets[j]);
            oppositeGroup.push(oppositeBets[j]);

            if (Math.abs(mainTotal - oppositeTotal) / Math.max(mainTotal, oppositeTotal) <= 0.05) {
              checkOppositeBets(mainGroup, oppositeGroup);
              break;
            }
          }
        }
      };

      checkGroupBets(bankerBets, playerBets);
      checkGroupBets(playerBets, bankerBets);

      newQueryResult.push(...oppositeBets);

      const newRounds = roundBets.map(bet => bet[GAME_ID]).filter(rid => !processedRounds.has(rid));
      for (const newRoundId of newRounds) {
        await processRound(newRoundId);
      }
    };

    const initialRounds = [...new Set(queryResult.map(row => row[GAME_ID]))];
    for (const roundId of initialRounds) {
      await processRound(roundId);
    }

    // Filter players based on 50% opposite betting rule
    const filteredQueryResult = newQueryResult.filter(bet => {
      const userId = bet[USER_ID];
      const stats = playerRoundStats[userId];
      if (!stats) return false;
      const totalWager = stats.oppositeWager + stats.nonOppositeWager;
      return stats.oppositeWager >= 0.5 * totalWager;
    });

    if (filteredQueryResult.length === 0) {
      // Clear the table if no players meet the opposite betting criteria
      setQueryResult([]);
      setBankerTotal(0);
      setPlayerTotal(0);
      setPlayerStats([]);
    } else {
      const finalPlayerIds = [...new Set(filteredQueryResult.map(bet => bet[USER_ID]))];
      setPlayerIds(finalPlayerIds.join(', '));
      setQueryResult(filteredQueryResult);
      setPlayerStats(Object.entries(playerRoundStats).map(([id, stats]) => {
        const totalWager = stats.oppositeWager + stats.nonOppositeWager;
        const oppositePercentage = ((stats.oppositeWager / totalWager) * 100).toFixed(2);
        return {
          id,
          totalRounds: stats.totalRounds.size,
          oppositeRounds: stats.oppositeRounds.size,
          oppositeWager: stats.oppositeWager.toFixed(2),
          nonOppositeWager: stats.nonOppositeWager.toFixed(2),
          oppositePercentage,
        };
      }).filter(stat => stat.oppositeWager >= 0.5 * (stat.oppositeWager + stat.nonOppositeWager)));
    }

    console.log('Final Query Result:', newQueryResult);
    setFinding(false);
  }, [queryResult, clientType, shouldStop]);

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
        {playerStats.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mt-6">Player Statistics</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Rounds</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opposite Rounds</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opposite Wager</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Non-Opposite Wager</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Opposite Wager</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {playerStats.map(stat => (
                  <tr key={stat.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.totalRounds}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.oppositeRounds}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.oppositeWager}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.nonOppositeWager}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.oppositePercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OppositeBetting;
