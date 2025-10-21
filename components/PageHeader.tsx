
import React from 'react';
import { PlusIcon } from './icons';

interface PageHeaderProps {
  title: string;
  buttonLabel: string;
  onButtonClick: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, buttonLabel, onButtonClick }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
      <button
        onClick={onButtonClick}
        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-150"
      >
        <PlusIcon className="w-5 h-5 mr-2" />
        {buttonLabel}
      </button>
    </div>
  );
};

export default PageHeader;
