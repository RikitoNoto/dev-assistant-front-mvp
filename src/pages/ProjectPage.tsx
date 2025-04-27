import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare } from 'lucide-react';
import Header from '../components/Header';
import ProjectTabs from '../components/ProjectTabs';
import MarkdownRenderer from '../components/MarkdownRenderer';
import TicketsList from '../components/TicketsList';
import { ProjectDetails } from '../types';
import { getProjectDetails } from '../mock/data';

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('plan');
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!projectId) return;
      
      try {
        setIsLoading(true);
        const data = await getProjectDetails(projectId);
        setProjectDetails(data);
      } catch (error) {
        console.error('Error fetching project details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectDetails();
  }, [projectId]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleNavigateToConversation = (type: 'plan' | 'technicalSpecs') => {
    navigate(`/project/${projectId}/conversation/${type}`);
  };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
    }

    if (!projectDetails) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Project not found</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'plan':
        return (
          <div className="relative">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <MarkdownRenderer content={projectDetails.plan} />
            </div>
            <button
              onClick={() => handleNavigateToConversation('plan')}
              className="absolute top-4 right-4 p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Edit in conversation"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
          </div>
        );
      case 'specs':
        return (
          <div className="relative">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <MarkdownRenderer content={projectDetails.technicalSpecs} />
            </div>
            <button
              onClick={() => handleNavigateToConversation('technicalSpecs')}
              className="absolute top-4 right-4 p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Edit in conversation"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
          </div>
        );
      case 'tickets':
        return <TicketsList tickets={projectDetails.tickets} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={projectDetails?.id ? `Project #${projectDetails.id}` : 'Project'} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="mb-6">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Projects
            </button>
          </div>
          
          <ProjectTabs activeTab={activeTab} onTabChange={handleTabChange} />
          
          <div className="mt-6">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectPage;