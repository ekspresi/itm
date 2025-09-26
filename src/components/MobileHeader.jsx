import React from 'react';

export default function MobileHeader({ setMenuCollapsed }) {
  return (
    <div className="md:hidden flex items-center p-4 bg-white shadow-md h-20">
         <button 
            onClick={() => setMenuCollapsed(false)} 
            className="p-2 text-gray-600 hover:text-blue-700"
        >
            <i className="fa-solid fa-bars fa-lg"></i>
        </button>
        <div className="ml-3">
            <h1 className="text-lg font-bold text-blue-800">Panel administracyjny</h1>
        </div>
    </div>
  );
}