import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import Header from '../components/Header';
import ProjectCard from '../components/ProjectCard';
import NewProjectModal from '../components/NewProjectModal';
import { Project } from '../types';
import { getProjects, createProject, openProject } from '../services/api';

const HomePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        // Sort projects by lastOpenedAt in descending order (most recently viewed first)
        const sortedProjects = [...data].sort((a, b) => {
          // Use lastOpenedAt for sorting if available, otherwise fall back to updatedAt
          const dateA = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : new Date(a.updatedAt).getTime();
          const dateB = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : new Date(b.updatedAt).getTime();
          return dateB - dateA;
        });
        setProjects(sortedProjects);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleProjectClick = (projectId: string) => {
    // Call openProject to record that this project was viewed
    // This will be used for sorting projects by last viewed date
    openProject(projectId).catch(error => {
      console.error('Error recording project open:', error);
      // Continue navigation even if the openProject call fails
    });
    
    navigate(`/project/${projectId}`);
  };

  const handleCreateProject = async (name: string) => {
    try {
      const newProject = await createProject(name);
      // Add new project and re-sort by lastOpenedAt
      setProjects((prev) => {
        const updatedProjects = [...prev, newProject];
        return updatedProjects.sort((a, b) => {
          // Use lastOpenedAt for sorting if available, otherwise fall back to updatedAt
          const dateA = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : new Date(a.updatedAt).getTime();
          const dateB = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : new Date(b.updatedAt).getTime();
          return dateB - dateA;
        });
      });
      setIsModalOpen(false);

      navigate(`/project/${newProject.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Projects</h1>
              <p className="mt-1 text-sm text-gray-500">
                Select a project to view details or create a new one
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                New Project
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {projects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onClick={handleProjectClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                  <p className="text-gray-500 mb-6">Create your first project to get started</p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Create Project
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <NewProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
};

export default HomePage;
