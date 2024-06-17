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
    <aside id="cta-button-sidebar" className="h-screen relative -bottom-7" aria-label="Sidebar">
      <div className="m-0.1 bg-white border-r border-r-gray-opacity text-white h-screen p-2 flex justify-center">
        <h1 className="text-2xl font-bold">
          
        </h1>
        <ul className="mt-20 space-y-4 ">
          {clients.map((client) => (
            <li key={client.name}>
              <Link
                to={client.path}
                className={` font-inter font-bold text-xs text-slate-600  block p-1 rounded text-center focus:ring-2 focus:ring-blue-500 ${location.pathname.startsWith(client.path) ? 'bg-zinc-300 bg-opacity-30' : 'hover:bg-zinc-400 '}`}
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
