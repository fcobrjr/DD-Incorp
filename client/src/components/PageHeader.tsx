import React from 'react';

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, children }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-3xl font-bold text-gray-800">{title}</h2>
      {children && <div className="flex items-center space-x-2">{children}</div>}
    </div>
  );
};

export default PageHeader;
