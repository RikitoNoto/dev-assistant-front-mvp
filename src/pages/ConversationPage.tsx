import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import Header from '../components/Header';
import ChatInterface from '../components/ChatInterface';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { Conversation, Message } from '../types';
import { getConversationHistory } from '../mock/data';
import { sendStreamingMessage, getPlanDocument, getTechSpecDocument } from '../services/api';

const ConversationPage: React.FC = () => {
  const { projectId, type } = useParams<{ projectId: string; type: 'plan' | 'technicalSpecs' }>();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);

  const typeName = type === 'plan' ? 'Project Plan' : 'Technical Specifications';

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId || !type) return;

      try {
        setIsLoading(true);
        setError(null); // Reset error state

        const conversationDataPromise = getConversationHistory(projectId, type);
        const documentPromise = type === 'plan'
          ? getPlanDocument(projectId)
          : getTechSpecDocument(projectId);

        const [conversationData, docContent] = await Promise.all([
          conversationDataPromise,
          documentPromise
        ]);

        setConversation(conversationData);
        setDocumentContent(docContent);

        if (docContent === null) {
            console.warn(`${typeName} document not found.`);
        }

      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || `Failed to load ${typeName} data.`);
        setConversation(null);
        setDocumentContent(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [projectId, type, typeName]);

  const handleSendMessage = (content: string) => {
    if (!projectId || !type || isSendingMessage) return;

    setIsSendingMessage(true);

    const userMessage: Message = {
      id: `m-user-${Date.now()}`,
      content,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    const aiMessagePlaceholder: Message = {
      id: `m-ai-${Date.now()}`,
      content: '',
      sender: 'ai',
      timestamp: new Date().toISOString(),
      streaming: true,
    };

    setConversation(prev => {
      const updatedMessages = prev ? [...prev.messages, userMessage, aiMessagePlaceholder] : [userMessage, aiMessagePlaceholder];
      return {
        id: prev?.id || `conv-${Date.now()}`,
        projectId,
        type,
        messages: updatedMessages,
      };
    });

    abortControllerRef.current?.abort();

    abortControllerRef.current = sendStreamingMessage(
      type,
      content,
      projectId,
      (chunk) => {
        console.log('Received chunk:', chunk);
        setConversation(prev => {
          if (!prev) return prev;
          if (!chunk.message) return prev;
          const updatedMessages = prev.messages.map(msg =>
            msg.id === aiMessagePlaceholder.id
              ? { ...msg, content: msg.content + chunk.message }
              : msg
          );
          return { ...prev, messages: updatedMessages };
        });
      },
      (err) => {
        console.error('Streaming error:', err);
        setConversation(prev => {
          if (!prev) return prev;
          const updatedMessages = prev.messages.map(msg =>
            msg.id === aiMessagePlaceholder.id
              ? { ...msg, content: 'Error receiving response.', streaming: false }
              : msg
          );
          return { ...prev, messages: updatedMessages };
        });
        setIsSendingMessage(false);
        abortControllerRef.current = null;
      },
      () => {
        setConversation(prev => {
          if (!prev) return prev;
          const updatedMessages = prev.messages.map(msg =>
            msg.id === aiMessagePlaceholder.id
              ? { ...msg, streaming: false }
              : msg
          );
          return { ...prev, messages: updatedMessages };
        });
        setIsSendingMessage(false);
        abortControllerRef.current = null;
      }
    );
  };


  const handleSave = () => {
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

    if (error) {
      return (
        <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg p-4">
           <p className="text-red-700">Error: {error}</p>
        </div>
      );
    }

    const currentContent = documentContent;

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
          {currentContent !== null ? (
             <MarkdownRenderer content={currentContent} />
          ) : (
             <p className="text-gray-500">{typeName} document not available.</p>
          )}
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
