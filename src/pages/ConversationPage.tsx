import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import Header from '../components/Header';
import ChatInterface from '../components/ChatInterface';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { Conversation, Message, ProjectDetails } from '../types';
import { getConversationHistory, getProjectDetails, sendMessage } from '../mock/data';

const ConversationPage: React.FC = () => {
  const { projectId, type } = useParams<{ projectId: string; type: 'plan' | 'technicalSpecs' }>();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const typeName = type === 'plan' ? 'Project Plan' : 'Technical Specifications';

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId || !type) return;
      
      try {
        setIsLoading(true);
        
        // Fetch both conversation history and project details
        const [conversationData, projectData] = await Promise.all([
          getConversationHistory(projectId, type),
          getProjectDetails(projectId)
        ]);
        
        setConversation(conversationData);
        setProjectDetails(projectData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId, type]);

  const handleSendMessage = async (content: string) => {
    if (!projectId || !type || isSendingMessage) return;

    try {
      setIsSendingMessage(true);
      const newMessage = await sendMessage(projectId, type, content);
      
      // Update conversation with new message
      setConversation(prev => {
        if (!prev) {
          return {
            id: `conv-${Date.now()}`,
            projectId,
            type,
            messages: [newMessage]
          };
        }
        return {
          ...prev,
          messages: [...prev.messages, newMessage]
        };
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSave = () => {
    // In a real app, this would save the changes to the backend
    navigate(`/project/${projectId}`);
  };

  const renderContent = () => {
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

    const currentContent = type === 'plan' ? projectDetails.plan : projectDetails.technicalSpecs;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)]">
        <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Current {typeName}</h2>
            <button
              onClick={handleSave}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </button>
          </div>
          <MarkdownRenderer content={currentContent} />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                AI Assistant - {typeName} Discussion
              </h2>
            </div>
            <ChatInterface
              messages={conversation?.messages || []}
              onSendMessage={handleSendMessage}
              isLoading={isSendingMessage}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={`Edit ${typeName}`} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="mb-6">
            <button
              onClick={() => navigate(`/project/${projectId}`)}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Project
            </button>
          </div>
          
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default ConversationPage;