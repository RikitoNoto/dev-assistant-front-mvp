import React, { useState, useRef, useEffect } from 'react';
import { X, Clock, AlertTriangle, CheckCircle, MessageSquare, Send, Check, Loader2 } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { Ticket, Message } from '../types';
import { IssueChatbot, defaultChatbotApiFunctions } from '../models/chatbot';
import ChatInterface from './ChatInterface';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';

interface IssueDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (updatedTicket: Ticket) => Promise<void>;
}

const IssueDetailModal: React.FC<IssueDetailModalProps> = ({ ticket, isOpen, onClose, onSave }) => {
  if (!isOpen || !ticket) return null;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatbotRef = useRef<IssueChatbot | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Diff view state
  const [showDiff, setShowDiff] = useState(false);
  const [originalContent, setOriginalContent] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Initialize chatbot when ticket changes
  useEffect(() => {
    if (ticket) {
      chatbotRef.current = new IssueChatbot(ticket.project_id, defaultChatbotApiFunctions);
      chatbotRef.current.setIssueId(ticket.issue_id);
      // Initialize original content for diff view
      setOriginalContent(ticket.description || '');
    }
    return () => {
      // Abort any ongoing request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [ticket]);

  const priorityIcons = {
    low: <Clock className="h-5 w-5 text-gray-400" />,
    medium: <Clock className="h-5 w-5 text-blue-500" />,
    high: <AlertTriangle className="h-5 w-5 text-red-500" />
  };

  const statusColors = {
    todo: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    review: 'bg-purple-100 text-purple-800',
    done: 'bg-green-100 text-green-800'
  };

  const statusLabels = {
    todo: 'To Do',
    'in-progress': 'In Progress',
    review: 'In Review',
    done: 'Done'
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };
  
  // Handle accepting diff changes
  const handleAcceptDiff = async () => {
    if (!ticket) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Create updated ticket with new description
      const updatedTicket: Ticket = {
        ...ticket,
        description: newContent
      };
      
      // Call the parent component's save function if provided
      if (onSave) {
        await onSave(updatedTicket);
      }
      
      // Update local state
      setOriginalContent(newContent);
      setShowDiff(false);
    } catch (err: any) {
      console.error('Error saving issue content:', err);
      setSaveError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle rejecting diff changes
  const handleRejectDiff = () => {
    setShowDiff(false);
    setNewContent('');
  };
  
  const handleSendMessage = (content: string) => {
    if (!content.trim() || !chatbotRef.current || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '',
      sender: 'ai',
      timestamp: new Date().toISOString(),
      streaming: true
    };
    
    setMessages(prev => [...prev, userMessage, aiMessage]);
    setIsLoading(true);
    
    // Convert messages to the format expected by the API
    const history = messages.map(msg => ({
      [msg.sender]: msg.content
    }));
    
    // Add the new user message to history
    history.push({ user: content });
    
    // Reset diff view state for new conversation
    setShowDiff(false);
    
    // Track if this is the first file chunk
    let isFirstFileChunk = true;
    
    // Use the issue-specific chat method
    abortControllerRef.current = chatbotRef.current.sendIssueContentMessage(
      content,
      history,
      (chunk) => {
        if (chunk.message) {
          setMessages(prev => {
            const newMessages = [...prev];
            const aiMessageIndex = newMessages.length - 1;
            newMessages[aiMessageIndex] = {
              ...newMessages[aiMessageIndex],
              content: newMessages[aiMessageIndex].content + chunk.message
            };
            return newMessages;
          });
        }
        
        // Handle file content for diff view
        if (chunk.file) {
          if (isFirstFileChunk) {
            // First chunk - initialize the diff view
            setShowDiff(true);
            setNewContent(chunk.file);
            isFirstFileChunk = false;
          } else {
            // For subsequent chunks, append to the existing content
            setNewContent(prev => prev + chunk.file);
          }
        }
      },
      (error) => {
        console.error('Error in chat:', error);
        setIsLoading(false);
      },
      () => {
        setMessages(prev => {
          const newMessages = [...prev];
          const aiMessageIndex = newMessages.length - 1;
          newMessages[aiMessageIndex] = {
            ...newMessages[aiMessageIndex],
            streaming: false
          };
          return newMessages;
        });
        setIsLoading(false);
      }
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold flex items-center">
            {ticket.isFromGitHub && <FaGithub className="inline-block mr-2 text-gray-600" size={16} />}
            {ticket.title}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex flex-grow overflow-hidden h-[75vh] relative">
          {/* Issue Details */}
          <div className={`${isChatOpen ? 'w-1/2' : 'w-full'} p-4 overflow-y-auto transition-all duration-300 ease-in-out`}>
            {/* Chat toggle button */}
            <button
              onClick={toggleChat}
              className={`fixed right-4 bottom-4 z-10 p-3 rounded-full shadow-lg ${isChatOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'} text-white transition-colors`}
              aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
            >
              <MessageSquare className="h-5 w-5" />
            </button>
            
            {/* Status and Priority */}
            <div className="flex flex-wrap gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[ticket.status]}`}>
                {ticket.status === 'done' && <CheckCircle className="h-4 w-4 inline-block mr-1" />}
                {statusLabels[ticket.status]}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 flex items-center">
                {priorityIcons[ticket.priority]}
                <span className="ml-1 capitalize">{ticket.priority} Priority</span>
              </span>
              {ticket.assignee && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                  Assigned to: {ticket.assignee}
                </span>
              )}
            </div>
            
            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Description</h3>
              
              {/* Save status messages */}
              {(isSaving || saveError) && (
                <div className={`mb-4 p-3 rounded-md border ${saveError ? 'bg-red-100 border-red-300 text-red-700' : 'bg-blue-100 border-blue-300 text-blue-700'}`}>
                  {isSaving && <><Loader2 className="h-4 w-4 mr-1 inline animate-spin" /> Saving...</>}
                  {saveError && `Save Error: ${saveError}`}
                </div>
              )}
              
              {/* Diff View */}
              {showDiff ? (
                <div className="mt-4 border border-gray-300 rounded-md">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex justify-between items-center">
                    <h3 className="text-md font-semibold text-gray-800">Suggested Changes</h3>
                    <div className="space-x-2">
                      <button
                        onClick={handleAcceptDiff}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        disabled={isSaving}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Accept
                      </button>
                      <button
                        onClick={handleRejectDiff}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        disabled={isSaving}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                  <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <ReactDiffViewer
                      oldValue={originalContent}
                      newValue={newContent}
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
              ) : (
                <div className="bg-gray-50 p-3 rounded-md text-gray-700 whitespace-pre-wrap">
                  {ticket.description || <span className="text-gray-400 italic">No description provided</span>}
                </div>
              )}
            </div>
            
            {/* Comments */}
            <div>
              <h3 className="text-lg font-medium mb-2">Comments ({ticket.comments?.length ?? 0})</h3>
              {(ticket.comments?.length ?? 0) > 0 ? (
                <div className="space-y-3">
                  {ticket.comments?.map(comment => (
                    <div key={comment.id} className="bg-gray-50 p-3 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{comment.author}</span>
                        <span className="text-sm text-gray-500">{new Date(comment.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No comments yet</p>
              )}
            </div>
          </div>
          
          {/* Chat Panel */}
          <div 
            className={`${isChatOpen ? 'w-1/2' : 'w-0'} h-full border-l border-gray-200 transition-all duration-300 ease-in-out overflow-hidden flex flex-col`}
          >
            {isChatOpen && (
              <>
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-medium">Issue Chat</h3>
                  <p className="text-sm text-gray-500">Ask questions about this issue</p>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ChatInterface
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                  />
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueDetailModal;
