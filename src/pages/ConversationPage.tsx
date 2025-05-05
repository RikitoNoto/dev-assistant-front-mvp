import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Loader2, Check, X } from 'lucide-react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import Header from '../components/Header';
import ChatInterface from '../components/ChatInterface';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { Conversation, Message } from '../types';
import { getConversationHistory } from '../mock/data';
import {
  sendStreamingMessage,
  getPlanDocument,
  getTechSpecDocument,
  savePlanDocument,
  saveTechSpecDocument
} from '../services/api';

const ConversationPage: React.FC = () => {
  const { projectId, type } = useParams<{ projectId: string; type: 'plan' | 'technicalSpecs' }>();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [originalDocumentContent, setOriginalDocumentContent] = useState<string>('');
  const [newDocumentContent, setNewDocumentContent] = useState<string>('');
  const [showDiff, setShowDiff] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [error, setError] = useState<string | null>(null);

  const typeName = type === 'plan' ? 'Project Plan' : 'Technical Specifications';

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId || !type) return;

      setIsLoading(true);
      setError(null);
      setConversation(null);
      setDocumentContent('');
      setOriginalDocumentContent('');
      setNewDocumentContent('');
      setShowDiff(false);

      try {
        const conversationDataPromise = getConversationHistory(projectId, type);
        const documentPromise = type === 'plan'
          ? getPlanDocument(projectId)
          : getTechSpecDocument(projectId);

        const [conversationResult, documentResult] = await Promise.allSettled([
          conversationDataPromise,
          documentPromise
        ]);

        let fetchedConversation: Conversation | null = null;
        let fetchedDocContent: string | null = null;
        let fetchError: string | null = null;

        if (conversationResult.status === 'fulfilled') {
          fetchedConversation = conversationResult.value;
        } else {
          console.error('Error fetching conversation history:', conversationResult.reason);
          fetchError = `Failed to load conversation history. ${conversationResult.reason?.message || ''}`;
        }

        if (documentResult.status === 'fulfilled') {
          fetchedDocContent = documentResult.value;
          if (fetchedDocContent === null) {
            console.warn(`${typeName} document not found.`);
          }
        } else {
          console.error(`Error fetching ${typeName} document:`, documentResult.reason);
          const docError = `Failed to load ${typeName} document. ${documentResult.reason?.message || ''}`;
          fetchError = fetchError ? `${fetchError}\n${docError}` : docError;
        }

        const initialDocContent = fetchedDocContent ?? '';
        setConversation(fetchedConversation);
        setDocumentContent(initialDocContent);
        setOriginalDocumentContent(initialDocContent);
        if (fetchError) {
            setError(fetchError);
        }

      } catch (err: any) {
        console.error('Unexpected error during data fetching:', err);
        setError(err.message || 'An unexpected error occurred.');
        setConversation(null);
        setDocumentContent('');
        setOriginalDocumentContent('');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [projectId, type, typeName]);

  const isFirstFileChunk = useRef(true);
  const handleSendMessage = (content: string) => {
    if (!projectId || !type || isSendingMessage) return;

    setIsSendingMessage(true);
    isFirstFileChunk.current = true;

    const history = conversation?.messages
      ?.filter(msg => !msg.streaming)
      .map(msg => ({ [msg.sender]: msg.content })) || [];

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
      history,
      projectId,
      (chunk) => {
        console.log('Received chunk:', chunk);
        setConversation(prev => {
          if (!prev) return prev;

          if (chunk.message) {
            const updatedMessages = prev.messages.map(msg =>
              msg.id === aiMessagePlaceholder.id
                ? { ...msg, content: msg.content + chunk.message }
                : msg
            );
            return { ...prev, messages: updatedMessages };
          }
          return prev;
        });

        if (chunk.file) {
          if (isFirstFileChunk.current) {
            setOriginalDocumentContent(documentContent);
            setNewDocumentContent(chunk.file);
            setShowDiff(true);
            isFirstFileChunk.current = false;
          } else {
            setNewDocumentContent(prev => prev + chunk.file);
          }
        }
      },
      (err: Error) => {
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

  const handleSave = async (contentToSave?: string) => {
    const finalContent = contentToSave ?? documentContent;
    if (!projectId || !type || !finalContent || isSaving) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      if (type === 'plan') {
        await savePlanDocument(projectId, finalContent);
      } else {
        await saveTechSpecDocument(projectId, finalContent);
      }
    } catch (err: any) {
      console.error('Error saving document:', err);
      setSaveError(err.message || `Failed to save ${typeName}.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAcceptDiff = async () => {
    const acceptedContent = newDocumentContent;
    setDocumentContent(acceptedContent);
    setOriginalDocumentContent(acceptedContent);
    setNewDocumentContent('');
    setShowDiff(false);
    await handleSave(acceptedContent);
  };

  const handleRejectDiff = () => {
    setNewDocumentContent('');
    setShowDiff(false);
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
          </div>
          {(isSaving || saveError) && (
            <div className={`mb-4 p-3 rounded-md border ${saveError ? 'bg-red-100 border-red-300 text-red-700' : 'bg-blue-100 border-blue-300 text-blue-700'}`}>
              {isSaving && <><Loader2 className="h-4 w-4 mr-1 inline animate-spin" /> Saving...</>}
              {saveError && `Save Error: ${saveError}`}
            </div>
          )}
          {showDiff ? (
            <div className="mt-4 border border-gray-300 rounded-md">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
                <h3 className="text-md font-semibold text-gray-800">Suggested Changes</h3>
                <div className="space-x-2">
                  <button
                    onClick={handleAcceptDiff}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Accept
                  </button>
                  <button
                    onClick={handleRejectDiff}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Reject
                  </button>
                </div>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <ReactDiffViewer
                  oldValue={originalDocumentContent}
                  newValue={newDocumentContent}
                  splitView={true}
                  compareMethod={DiffMethod.WORDS}
                  styles={{
                    diffContainer: { fontSize: '0.875rem' },
                    gutter: { minWidth: '1rem' },
                    line: { lineHeight: '1.5' },
                  }}
                  useDarkTheme={false}
                />
              </div>
            </div>
          ) : currentContent !== null && currentContent !== '' ? (
             <MarkdownRenderer content={currentContent} />
          ) : (
             <p className="text-gray-500 mt-4">{typeName} document not available or empty.</p>
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
