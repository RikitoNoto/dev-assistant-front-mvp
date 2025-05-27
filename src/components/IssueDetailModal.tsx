import React, { useState, useRef, useEffect } from 'react';
import { X, Clock, AlertTriangle, CheckCircle, Send } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { Ticket, Message } from '../types';
import { IssueChatbot, defaultChatbotApiFunctions } from '../models/chatbot';

interface IssueDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
}

const IssueDetailModal: React.FC<IssueDetailModalProps> = ({ ticket, isOpen, onClose }) => {
  if (!isOpen || !ticket) return null;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatbotRef = useRef<IssueChatbot | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize chatbot when ticket changes
  useEffect(() => {
    if (ticket) {
      chatbotRef.current = new IssueChatbot(ticket.project_id, defaultChatbotApiFunctions);
    }
    return () => {
      // Abort any ongoing request when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [ticket]);
  
  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
  
  const handleSendMessage = () => {
    if (!inputMessage.trim() || !chatbotRef.current || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
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
    setInputMessage('');
    setIsLoading(true);
    
    // Convert messages to the format expected by the API
    const history = messages.map(msg => ({
      [msg.sender]: msg.content
    }));
    
    // Add the new user message to history
    history.push({ user: inputMessage });
    
    abortControllerRef.current = chatbotRef.current.sendMessage(
      'issue',
      inputMessage,
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
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
            
            {/* Chat Toggle Button */}
            <button 
              onClick={toggleChat}
              className={`absolute top-4 right-4 z-10 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 ${isChatOpen ? 'opacity-0' : 'opacity-100'}`}
              aria-label="Open chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* Chat Section */}
          <div 
            className={`absolute top-0 right-0 bottom-0 w-1/2 flex flex-col h-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">AI Assistant Chat</h3>
                <p className="text-sm text-gray-500">Ask questions about this issue or get assistance</p>
              </div>
              <button 
                onClick={toggleChat}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close chat"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 min-h-[50vh]">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 italic">No messages yet. Start a conversation with the AI.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] p-3 rounded-lg ${message.sender === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-800'}`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        {message.streaming && (
                          <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse">|</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            <div className="p-3 border-t">
              <div className="flex items-center">
                <textarea
                  className="flex-grow p-2 border rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={3}
                  disabled={isLoading}
                />
                <button
                  className={`p-2 rounded-r-md ${isLoading 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                  onClick={handleSendMessage}
                  disabled={isLoading}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
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
