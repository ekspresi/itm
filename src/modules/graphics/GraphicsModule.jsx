import React, { useState } from 'react';
import ButtonSelectGroup from '../../components/ButtonSelectGroup';
import GraphicsEditor from './GraphicsEditor';
import { useAuth } from '../../lib/AuthContext';

function GraphicsModule() {
  const [activeTab, setActiveTab] = useState('editor');
  const { user } = useAuth();

  const tabs = [{ id: 'editor', label: 'Edytor', icon: 'fa-solid fa-pen-ruler' }];

  const renderContent = () => {
    switch (activeTab) {
      case 'editor':
      default:
        return <GraphicsEditor />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold">Generator grafik</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Twórz i zarządzaj grafikami na podstawie szablonów.
        </p>
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <ButtonSelectGroup
          buttons={tabs}
          selected={activeTab}
          onSelect={setActiveTab}
        />
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}

export default GraphicsModule;