import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare } from 'lucide-react';
import Header from '../components/Header';
import ProjectTabs from '../components/ProjectTabs';
import MarkdownRenderer from '../components/MarkdownRenderer';
import TicketsList from '../components/TicketsList';
import { getPlanDocument, getTechSpecDocument } from '../services/api';

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('plan');
  const [planContent, setPlanContent] = useState<string | null>(null);
  const [techSpecContent, setTechSpecContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!projectId) return;

      setIsLoading(true);
      setError(null);

      try {
        const [planData, techSpecData] = await Promise.all([
          getPlanDocument(projectId),
          getTechSpecDocument(projectId)
        ]);

        setPlanContent(planData);
        setTechSpecContent(techSpecData);

        if ( planData === null || techSpecData === null) {
          console.warn("Some project data might be missing.");
        }

      } catch (err: any) {
        console.error('Error fetching project data:', err);
        setError(err.message || 'Failed to load project data.');
        setPlanContent(null);
        setTechSpecContent(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
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

    if (error) {
      return (
        <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {error}</p>
        </div>
      );
    }

    const handleNavigateToConversation = (type: 'plan' | 'technicalSpecs' | 'tickets') => {
      navigate(`/project/${projectId}/conversation/${type}`);
    };



    switch (activeTab) {
      case 'plan':
        return (
          <div className="relative">
            <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-[200px]">
              {planContent !== null ? (
                <MarkdownRenderer content={planContent} />
              ) : (
                <p className="text-gray-500">Plan document not available.</p>
              )}
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
            <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-[200px]">
              {techSpecContent !== null ? (
                <MarkdownRenderer content={techSpecContent} />
            ) : (
                  <p className="text-gray-500">Technical specifications document not available.</p>
            )}
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
        return (
          <div className="relative">
            <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-[200px]">
              <TicketsList tickets={[]} />
            </div>
            <button
              onClick={() => handleNavigateToConversation('tickets')}
              className="absolute top-4 right-4 p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Edit in conversation"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={`Project title`} />

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
