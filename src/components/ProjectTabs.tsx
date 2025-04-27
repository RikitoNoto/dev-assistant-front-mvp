import React from 'react';
import { FileText, Code, Ticket } from 'lucide-react';

interface ProjectTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ProjectTabs: React.FC<ProjectTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'plan', label: 'Project Plan', icon: <FileText className="h-5 w-5" /> },
    { id: 'specs', label: 'Technical Specs', icon: <Code className="h-5 w-5" /> },
    { id: 'tickets', label: 'Tickets', icon: <Ticket className="h-5 w-5" /> },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="flex -mb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default ProjectTabs;