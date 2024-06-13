import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AiOutlineLink, AiOutlineUser, AiOutlineNumber,AiOutlineSave } from 'react-icons/ai'; // Import icons from react-icons
import Player from './Player';
import RoundID from './RoundID';
import Connection from './Connection';

const Client1 = () => {
  const location = useLocation();
  const tabs = [
    { name: 'Connection', path: 'connection', icon: <AiOutlineLink className='text-black' /> }, // Add icon for Connection
    { name: 'Player', path: 'player', icon: <AiOutlineUser /> }, // Add icon for Player
    { name: 'Round ID', path: 'roundid', icon: <AiOutlineNumber /> }, // Add icon for Round ID
  ];

  return (
    <div className=" w-full">
      <nav className="bg-gray-800 text-white shadow-md">
        <ul className="flex m-0 p-0 list-none ">
          {tabs.map((tab) => (
            <li key={tab.name}>
              <Link
                to={tab.path}
                className={`block p-2 font-sans uppercase font-medium text-white ${location.pathname.endsWith(tab.path) ? 'bg-gray-600' : 'hover:bg-gray-900'} `}
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
        <Route path="*" element={<div>Select a tab</div>} />
      </Routes>
    </div>
  );
};

export default Client1;