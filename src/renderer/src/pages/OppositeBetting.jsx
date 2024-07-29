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
  const [timeFrame, setTimeFrame] = useState('Today');

  const euroFormatter = new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
  });

  const BET_POSITION = "Bet Position";
  const BET_POSITION_PLAYER = "PLAYER";
  const BET_POSITION_BANKER = "BANKER";
  const BET_EUR = "amount_eur";
  const GAME_ID = "gameid";
  const USER_ID = "User Id";
  const CREATE_DATE = "createdate";

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

  const getTimeFrameFilter = () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (timeFrame === 'Today') {
      return `DATE("${CREATE_DATE}") = '${today.toISOString().split('T')[0]}'`;
    } else if (timeFrame === 'Yesterday') {
      return `DATE("${CREATE_DATE}") = '${yesterday.toISOString().split('T')[0]}'`;
    }
    return '';
  };

  const executeQuery = async () => {
    try {
      setLoading(true);
      setQueryResult([]);
      const playerIdsArray = playerIds.split(',').map(id => id.trim());
      let queryText = selectedQuery;
      const timeFrameFilter = getTimeFrameFilter();

      if (playerIdsArray.length > 0 || timeFrameFilter) {
        queryText += ' WHERE';
        if (playerIdsArray.length > 0) {
          queryText += ` "${USER_ID}" IN (${playerIdsArray.map(id => `'${id}'`).join(', ')})`;
        }
        if (playerIdsArray.length > 0 && timeFrameFilter) {
          queryText += ' AND';
        }
        if (timeFrameFilter) {
          queryText += ` ${timeFrameFilter}`;
        }
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

  const updatePlayerStatistics = (additionalPlayerData, initialBet, otherBet, playerStats, matchGameIds, noMatchGameIds) => {
    const lowerBound = initialBet.amount_eur * 0.9;
    const upperBound = initialBet.amount_eur * 1.1;

    additionalPlayerData.forEach(round => {
        const initialUserId = initialBet["User Id"];
        const initialBetPosition = initialBet["Bet Position"];
        const initialBetAmount = initialBet["amount_eur"];

        const otherUserId = otherBet["User Id"];
        const otherBetPosition = otherBet["Bet Position"];
        const otherBetAmount = otherBet.amount_eur;

        console.log(`📝 Initial Round  - User ID: ${initialUserId}, Bet Position: ${initialBetPosition}, Bet Amount: ${initialBetAmount}, Game ID: ${round.gameid}`);
        console.log(`📝 Other Bet  - User ID: ${otherUserId}, Bet Position: ${otherBetPosition}, Bet Amount: ${otherBetAmount}, Game ID: ${round.gameid}`);

        if (!playerStats[otherUserId]) {
            playerStats[otherUserId] = {
                gamesInCommon: 0,
                gamesNotInCommon: 0,
                gamesInCommonWager: 0,
                gamesNotInCommonWager: 0,
                percentageCommonRounds: 0,
                percentageCommonWager: 0
            };
        }

        if (initialUserId !== otherUserId && initialBetPosition !== otherBetPosition && initialBetAmount >= lowerBound && initialBetAmount <= upperBound) {
            matchGameIds.add(round.gameid);
            console.log(`🔍 Matching Round - User ID: ${initialUserId}, Bet Position: ${initialBetPosition}, Bet Amount: ${initialBetAmount}, Opposite Bet Position: ${otherBetPosition}, Opposite User ID: ${otherUserId}, Game ID: ${round.gameid}.`);
            playerStats[otherUserId].gamesInCommon++;
            playerStats[otherUserId].gamesInCommonWager += otherBetAmount;
        } else {
            noMatchGameIds.add(round.gameid);
            console.log(`❌ Non-Matching Round - User ID: ${initialUserId}, Bet Position: ${initialBetPosition}, Bet Amount: ${initialBetAmount}, Lower Bound: ${lowerBound}, Upper Bound: ${upperBound}, Opposite Bet Position: ${otherBetPosition}, Opposite User ID: ${otherUserId}, Game ID: ${round.gameid}.`);
            playerStats[otherUserId].gamesNotInCommon++;
            playerStats[otherUserId].gamesNotInCommonWager += otherBetAmount;
        }

        console.log(`🕵️‍♂️ Related Bet - User ID: ${otherUserId}, Bet Position: ${otherBetPosition}, Bet Amount: ${otherBetAmount}, Game ID: ${round.gameid}.`);
    });
  };

  const findOppositeBets = useCallback(async () => {
    if (queryResult.length === 0 || !playerIds) return;

    console.clear();
    setFinding(true);

    let initialPlayerIds = new Set(playerIds.split(',').map(id => id.trim()));
    let updatedPlayerIds = new Set([...initialPlayerIds]);

    console.log("🌟 Initial Player IDs:", Array.from(initialPlayerIds).join(', '));

    const matchGameIds = new Set();
    const noMatchGameIds = new Set();
    const suspiciousPlayerIds = new Set();
    const potentialOppositeBetCounts = {};
    const timeFrameFilter = getTimeFrameFilter();

    const updatePotentialOppositeBetCount = (userId) => {
        if (!potentialOppositeBetCounts[userId]) {
            potentialOppositeBetCounts[userId] = 0;
        }
        potentialOppositeBetCounts[userId]++;
    };

    const playerStats = {};
    updatedPlayerIds.forEach(playerId => {
        playerStats[playerId] = {
            gamesInCommon: 0,
            gamesNotInCommon: 0,
            gamesInCommonWager: 0,
            gamesNotInCommonWager: 0,
            percentageCommonRounds: 0,
            percentageCommonWager: 0
        };
    });

    for (let bet of queryResult) {
        if (matchGameIds.has(bet.gameid) || noMatchGameIds.has(bet.gameid)) {
            console.log(`🔍 Skipping Game ID ${bet.gameid} as it has already been processed.`);
            continue;
        }

        console.log(`🔄 Querying Game ID ${bet.gameid} for matching rounds.`);

        const otherPlayerBets = await window.electron.executeQuery({
            clientType,
            query: `SELECT * FROM public.fraud_round_history WHERE "gameid" = '${bet.gameid}' AND "User Id" != '${bet["User Id"]}' AND ${timeFrameFilter}`
        });

        let foundMatch = false;
        for (let otherBet of otherPlayerBets) {
            if (otherBet.gameid === bet.gameid &&
                otherBet["Bet Position"] !== bet["Bet Position"] &&
                bet["User Id"] !== otherBet["User Id"]) {
                const lowerBound = bet.amount_eur * 0.9;
                const upperBound = bet.amount_eur * 1.1;
                if (otherBet.amount_eur >= lowerBound && otherBet.amount_eur <= upperBound) {
                    console.log("🔍 Opposite Bet Found! 🎉");
                    console.log(`👥 Opposite Betting Pair: Player ${bet["User Id"]} (${bet["Bet Position"]}) and Player ${otherBet["User Id"]} (${otherBet["Bet Position"]})`);
                    console.log(`🏆 Game ID: ${otherBet.gameid}`);
                    console.log(`💰 Bet Amount: ${otherBet.amount_eur}`);

                    updatedPlayerIds.add(otherBet["User Id"]);
                    updatePotentialOppositeBetCount(otherBet["User Id"]);
                    foundMatch = true;

                    if (potentialOppositeBetCounts[otherBet["User Id"]] >= 5) {
                        console.log(`🚫 Stopping further queries for Player ${otherBet["User Id"]} as threshold is met.`);
                        suspiciousPlayerIds.add(otherBet["User Id"]);
                        matchGameIds.add(bet.gameid);

                        const additionalPlayerData = await window.electron.executeQuery({
                            clientType,
                            query: `SELECT * FROM public.fraud_round_history WHERE "User Id" IN ('${bet["User Id"]}', '${otherBet["User Id"]}') AND ${timeFrameFilter}`
                        });

                        updatePlayerStatistics(additionalPlayerData, bet, otherBet, playerStats, matchGameIds, noMatchGameIds);

                        break;
                    }
                }
            }
        }

        if (foundMatch) {
            console.log(`✅ Match found for Game ID ${bet.gameid}.`);
            matchGameIds.add(bet.gameid);
        } else {
            console.log(`❌ No match found for Game ID ${bet.gameid}.`);
            noMatchGameIds.add(bet.gameid);
        }
    }

    console.log("🚦 Querying detailed game data for updated player IDs...");
    await queryDetailedGameData(initialPlayerIds, updatedPlayerIds, matchGameIds, suspiciousPlayerIds, playerStats);

    setPlayerStats(Object.entries(playerStats).map(([id, stats]) => ({ id, ...stats })));
    setFinding(false);
  }, [queryResult, clientType, playerIds]);

  const queryDetailedGameData = async (initialPlayerIds, updatedPlayerIds, matchGameIds, suspiciousPlayerIds, playerStats) => {
    if (updatedPlayerIds.size > initialPlayerIds.size) {
        const nonSuspiciousPlayerIds = Array.from(updatedPlayerIds).filter(id => !suspiciousPlayerIds.has(id));
        const nonProcessedGameIds = Array.from(matchGameIds);
        const timeFrameFilter = getTimeFrameFilter();

        if (nonSuspiciousPlayerIds.length > 0 && nonProcessedGameIds.length > 0) {
            const allGameData = await window.electron.executeQuery({
                clientType,
                query: `SELECT "gameid", "User Id", "Bet Position", "amount_eur" FROM public.fraud_round_history WHERE "User Id" IN (${nonSuspiciousPlayerIds.map(id => `'${id}'`).join(', ')}) AND "gameid" IN (${nonProcessedGameIds.map(id => `'${id}'`).join(', ')}) AND  ${timeFrameFilter}`
            });

            processGameData(allGameData, initialPlayerIds, updatedPlayerIds, matchGameIds, suspiciousPlayerIds, playerStats);
        } else {
            console.log("🚫 No non-suspicious players found for further detailed querying.");
        }
    } else {
        console.log("🚫 No New Players with Opposite Bets Found.");
    }
  };

  const processGameData = (allGameData, initialPlayerIds, updatedPlayerIds, matchGameIds, suspiciousPlayerIds, playerStats) => {
    const gameToInitialPlayers = {};
    allGameData.forEach(entry => {
        const { gameid, "User Id": userId } = entry;
        if (initialPlayerIds.has(userId)) {
            if (!gameToInitialPlayers[gameid]) {
                gameToInitialPlayers[gameid] = [];
            }
            gameToInitialPlayers[gameid].push(entry);
        }
    });

    console.log("📊 Game to Initial Players Mapping:", gameToInitialPlayers);

    const processedRounds = new Set();

    allGameData.forEach(entry => {
        const { gameid, "User Id": userId, amount_eur, "Bet Position": betPosition } = entry;
        const roundKey = `${gameid}-${userId}`;
        if (!updatedPlayerIds.has(userId) || processedRounds.has(roundKey)) return;

        const initialPlayerBets = gameToInitialPlayers[gameid] || [];
        let hasInitialPlayer = false;

        for (const initialBet of initialPlayerBets) {
            if (initialBet["Bet Position"] !== betPosition) {
                const lowerBound = initialBet.amount_eur * 0.9;
                const upperBound = initialBet.amount_eur * 1.1;
                if (amount_eur >= lowerBound && amount_eur <= upperBound) {
                    hasInitialPlayer = true;
                    break;
                }
            }
        }

        if (!playerStats[userId]) {
            playerStats[userId] = {
                gamesInCommon: 0,
                gamesNotInCommon: 0,
                gamesInCommonWager: 0,
                gamesNotInCommonWager: 0,
                percentageCommonRounds: 0,
                percentageCommonWager: 0
            };
        }

        if (hasInitialPlayer) {
            console.log(`📊 Round with Initial Player: Game ID: ${gameid}, User ID: ${userId}, Bet Amount: ${amount_eur}`);
            playerStats[userId].gamesInCommon++;
            playerStats[userId].gamesInCommonWager += amount_eur || 0;
        } else {
            console.log(`📊 Round without Initial Player: Game ID: ${gameid}, User ID: ${userId}, Bet Amount: ${amount_eur}`);
            playerStats[userId].gamesNotInCommon++;
            playerStats[userId].gamesNotInCommonWager += amount_eur || 0;
        }

        processedRounds.add(roundKey);

        console.log(`🔄 Processing game data... Game ID: ${gameid}, User ID: ${userId}, Has Initial Player: ${hasInitialPlayer}, Bet Amount: ${amount_eur}`);
    });

    Object.entries(playerStats).forEach(([playerId, stats]) => {
        console.log(`📊 Calculating stats for Player ID: ${playerId}`);
        console.log(`  - Games in Common: ${stats.gamesInCommon}`);
        console.log(`  - Games not in Common: ${stats.gamesNotInCommon}`);
        console.log(`  - Wager in Common: ${stats.gamesInCommonWager}`);
        console.log(`  - Wager not in Common: ${stats.gamesNotInCommonWager}`);

        stats.TotalRounds = stats.gamesInCommon + stats.gamesNotInCommon;
        const totalWager = stats.gamesInCommonWager + stats.gamesNotInCommonWager;
        if (stats.TotalRounds > 0) {
            stats.percentageCommonRounds = (stats.gamesInCommon / stats.TotalRounds) * 100;
        }
        if (totalWager > 0) {
            stats.percentageCommonWager = (stats.gamesInCommonWager / totalWager) * 100;
        }

        if (stats.percentageCommonRounds >= 50 && stats.percentageCommonWager >= 50) {
            suspiciousPlayerIds.add(playerId);
            initialPlayerIds.add(playerId);
            matchGameIds.add(playerId);
        }
    });

    console.log("📊 Statistics of Rounds with and without Initial Players:");
    Object.entries(playerStats).forEach(([playerId, stats]) => {
        console.log(`🆔 Player ID: ${playerId}`);
        console.log(`  - Rounds with Initial Players: ${stats.gamesInCommon}`);
        console.log(`  - Rounds with Initial Players Wager: ${euroFormatter.format(stats.gamesInCommonWager)}`);
        console.log(`  - Rounds without Initial Players: ${stats.gamesNotInCommon}`);
        console.log(`  - Rounds without Initial Players Wager: ${euroFormatter.format(stats.gamesNotInCommonWager)}`);
        console.log(`  - Total Rounds: ${stats.TotalRounds}`);
        console.log(`  - Percentage of Common Rounds: ${stats.percentageCommonRounds.toFixed(2)}%`);
        console.log(`  - Percentage of Common Wager: ${stats.percentageCommonWager.toFixed(2)}%`);
      
        if (suspiciousPlayerIds.has(playerId)) {
            console.log(`  - 🚩 This player is flagged as suspicious!`);
        }
    });

    console.log("📊 Statistics for Initial Players:");
    initialPlayerIds.forEach(initialPlayerId => {
        let gamesInCommon = 0;
        let gamesNotInCommon = 0;
        let gamesInCommonWager = 0;
        let gamesNotInCommonWager = 0;

        allGameData.forEach(entry => {
            if (entry["User Id"] === initialPlayerId) {
                const gameid = entry.gameid;
                const hasInitialPlayer = gameToInitialPlayers[gameid] && gameToInitialPlayers[gameid].some(bet => !initialPlayerIds.has(bet["User Id"]));
                if (hasInitialPlayer) {
                    gamesInCommon++;
                    gamesInCommonWager += entry.amount_eur;
                } else {
                    gamesNotInCommon++;
                    gamesNotInCommonWager += entry.amount_eur;
                }
            }
        });

        const totalRounds = gamesInCommon + gamesNotInCommon;
        const totalWager = gamesInCommonWager + gamesNotInCommonWager;
        const percentageCommonRounds = totalRounds > 0 ? (gamesInCommon / totalRounds) * 100 : 0;
        const percentageCommonWager = totalWager > 0 ? (gamesInCommonWager / totalWager) * 100 : 0;

        console.log(`🆔 Initial Player ID: ${initialPlayerId}`);
        console.log(`  - Rounds with Updated Players: ${gamesInCommon}`);
        console.log(`  - Rounds with Updated Players Wager: ${euroFormatter.format(gamesInCommonWager)}`);
        console.log(`  - Rounds without Updated Players: ${gamesNotInCommon}`);
        console.log(`  - Rounds without Updated Players Wager: ${euroFormatter.format(gamesNotInCommonWager)}`);
        console.log(`  - Total Rounds: ${totalRounds}`);
        console.log(`  - Percentage of Common Rounds: ${percentageCommonRounds.toFixed(2)}%`);
        console.log(`  - Percentage of Common Wager: ${percentageCommonWager.toFixed(2)}%`);
    });
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
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Time Frame</label>
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
          >
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
          </select>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.TotalRounds}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.gamesInCommon}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{euroFormatter.format(stat.gamesInCommonWager)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{euroFormatter.format(stat.gamesNotInCommonWager)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat.percentageCommonWager.toFixed(2)}%</td>
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
