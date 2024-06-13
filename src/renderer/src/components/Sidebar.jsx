import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  const clients = [
    { name: 'CG', path: '/client1' },
    { name: 'MG', path: '/client2' },
    { name: 'SL', path: '/client3' },
    { name: 'AG', path: '/client4' },
  ];

  return (
    <>
    <aside id="cta-button-sidebar" className="h-screen transition-transform -translate-x-full sm:translate-x-0" aria-label="Sidebar">
      <div className="w-16 bg-gray-800 text-white h-screen p-4 flex justify-center">
        <h1 className="text-2xl font-bold mb-6">
          
        </h1>
        <ul className="space-y-4 ">
          {clients.map((client) => (
            <li key={client.name}>
              <Link
                to={client.path}
                className={` font-medium text-gray-400  block p-2 rounded text-center focus:ring-2 focus:ring-blue-500 ${location.pathname.startsWith(client.path) ? 'bg-gray-600' : 'hover:bg-gray-700 '}`}
              >
                {client.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
