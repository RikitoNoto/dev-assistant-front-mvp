import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onClick: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={() => onClick(project.id)}
    >
      <div className="h-36 bg-gray-200 overflow-hidden">
        {project.thumbnail ? (
          <img 
            src={project.thumbnail} 
            alt={project.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-indigo-50">
            <span className="text-indigo-400 text-lg font-medium">{project.name[0]}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Updated {new Date(project.updatedAt).toLocaleDateString()}
          </div>
          <button 
            className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            onClick={(e) => {
              e.stopPropagation();
              onClick(project.id);
            }}
          >
            View <ArrowRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;