'use client';

import React from 'react';

interface AttributeSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const AttributeSection: React.FC<AttributeSectionProps> = ({ title, icon, children }) => {
  return (
    <div className="p-4">
      <h4 className="font-yekan mb-3 flex items-center gap-2 font-semibold text-sm text-gray-800">
        {icon}
        {title}
      </h4>
      <div className="grid grid-cols-1 gap-3">{children}</div>
    </div>
  );
};

export default AttributeSection;
