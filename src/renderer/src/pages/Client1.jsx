import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AiOutlineLink, AiOutlineUser, AiOutlineNumber,AiOutlineSave } from 'react-icons/ai'; // Import icons from react-icons
import Player from './Player';
import RoundID from './RoundID';
import Connection from './Connection';
import OppositeBetting from './OppositeBetting'

const Client1 = () => {
  const location = useLocation();
  const tabs = [
    { name: 'Connection', path: 'connection', icon: <AiOutlineLink className='text-black' /> }, // Add icon for Connection
    { name: 'Player', path: 'player', icon: <AiOutlineUser /> }, // Add icon for Player
    { name: 'Round ID', path: 'roundid', icon: <AiOutlineNumber /> }, // Add icon for Round ID
    { name: 'OppositeBetting', path: 'OppositeBetting', icon: <AiOutlineNumber /> }, // Add icon for Round ID
  ];

  return (
    <div className=" w-full h-full ">
      <nav className="bg-white border-r border-r-gray-opacity sticky top-0 z-40">
        <ul className="flex m-0 p-0 list-none relative -left-12">
          {tabs.map((tab) => (
            <li key={tab.name}>
              <Link
                to={tab.path}
                className={`min-w-24 block pl-5 p-2 font-inter font-medium text-xs text-slate-700 ${location.pathname.endsWith(tab.path) ? 'bg-gray-100' : 'hover:bg-gray-100'} `}
              >
                <div className="flex items-center">

                  {tab.icon} 

                  <span className="ml-2">{tab.name}</span>
                  
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <Routes>
        <Route path="connection" element={<Connection clientType="client1" />} />
        <Route path="player" element={<Player clientType="client1" />} />
        <Route path="roundid" element={<RoundID clientType="client1" />} />
        <Route path="OppositeBetting" element={<OppositeBetting clientType="client1" />} />
        <Route path="*" element={<div>Select a tab</div>} />
      </Routes>
    </div>
  );
};

export default Client1;