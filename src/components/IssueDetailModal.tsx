import React, { useState, useRef, useEffect } from 'react';
import { X, Clock, AlertTriangle, CheckCircle, MessageSquare, Send } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { Ticket, Message } from '../types';
import { IssueChatbot, defaultChatbotApiFunctions } from '../models/chatbot';
import ChatInterface from './ChatInterface';

interface IssueDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

const IssueDetailModal: React.FC<IssueDetailModalProps> = ({ ticket, isOpen, onClose }) => {
  if (!isOpen || !ticket) return null;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatbotRef = useRef<IssueChatbot | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Initialize chatbot when ticket changes
  useEffect(() => {
    if (ticket) {
      chatbotRef.current = new IssueChatbot(ticket.project_id, defaultChatbotApiFunctions);
      chatbotRef.current.setIssueId(ticket.issue_id);
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
              <div className="bg-gray-50 p-3 rounded-md text-gray-700 whitespace-pre-wrap">
                {ticket.description || <span className="text-gray-400 italic">No description provided</span>}
              </div>
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
