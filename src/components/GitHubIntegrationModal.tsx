import React, { useState, useEffect } from 'react';
import { X, Loader2, Github } from 'lucide-react';
import { GitHubProject } from '../types';
import { getGitHubProjects, connectProjectToGitHub } from '../services/api';

interface GitHubIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

const GitHubIntegrationModal: React.FC<GitHubIntegrationModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onSuccess
}) => {
  const [githubProjects, setGithubProjects] = useState<GitHubProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchGitHubProjects();
    }
  }, [isOpen]);

  const fetchGitHubProjects = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const projects = await getGitHubProjects();
      setGithubProjects(projects);
    } catch (err: any) {
      console.error('Error fetching GitHub projects:', err);
      setError(err.message || 'Failed to load GitHub projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedProjectId) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      await connectProjectToGitHub(projectId, selectedProjectId);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error connecting to GitHub:', err);
      setError(err.message || 'Failed to connect to GitHub repository');
    } finally {
      setIsConnecting(false);
    }
  };

  const filteredProjects = githubProjects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Github className="h-5 w-5 mr-2" />
            Connect to GitHub
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 flex-grow overflow-auto">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}
          
          <p className="mb-4 text-gray-600">
            Connect your project to a GitHub repository to sync your code and issues.
          </p>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search repositories..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="border border-gray-200 rounded-md overflow-hidden">
              {filteredProjects.length > 0 ? (
                <div className="max-h-64 overflow-y-auto">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className={`p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
                        selectedProjectId === project.id ? 'bg-indigo-50' : ''
                      }`}
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      <div className="flex items-start">
                        <input
                          type="radio"
                          name="github-project"
                          checked={selectedProjectId === project.id}
                          onChange={() => setSelectedProjectId(project.id)}
                          className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-gray-900">{project.name}</h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No repositories found matching your search' : 'No repositories available'}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={!selectedProjectId || isConnecting}
            className={`px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              !selectedProjectId || isConnecting
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 inline animate-spin" /> Connecting...
              </>
            ) : (
              'Connect'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GitHubIntegrationModal;
