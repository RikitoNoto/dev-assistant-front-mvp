import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import ChatInterface from './ChatInterface';
import { Conversation, Message, Ticket } from '../types';
import { getConversationHistory } from '../mock/data';
import { ApiFunctions, sendStreamingMessage, getPlanDocument, getTechSpecDocument, getIssues } from '../services/api';
import { Chatbot, PlanChatbot, TechSpecChatbot, IssueChatbot } from '../models/chatbot';

interface ChatSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  type: 'plan' | 'technicalSpecs' | 'issue';
  onDiffChange?: (showDiff: boolean, originalContent: string, newContent: string, isFirstChunk: boolean) => void;
}

const ChatSidePanel: React.FC<ChatSidePanelProps> = ({ isOpen, onClose, projectId, type, onDiffChange }) => {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatbot, setChatbot] = useState<Chatbot | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Document content reference for diff
  const documentContentRef = useRef<string>('');
  const isFirstFileChunk = useRef(true);

  useEffect(() => {
    // Setup chatbot
    const chatApiFuncs: Pick<ApiFunctions, 'sendStreamingMessage'> = { sendStreamingMessage };
    if (type === 'plan') {
      setChatbot(new PlanChatbot(projectId, chatApiFuncs));
    } else if (type === 'technicalSpecs') {
      setChatbot(new TechSpecChatbot(projectId, chatApiFuncs));
    } else if (type === 'issue') {
      setChatbot(new IssueChatbot(projectId, chatApiFuncs));
    }
  }, [projectId, type]);



  // チャット履歴
  useEffect(() => {
    const fetchConversation = async () => {
      setIsLoading(true);
      try {
        const data = await getConversationHistory(projectId, type);
        setConversation(data);
      } catch (err) {
        setConversation(null);
      } finally {
        setIsLoading(false);
      }
    };
    if (isOpen) fetchConversation();
  }, [projectId, type, isOpen]);

  // メッセージ送信&AI返答ハンドリング
  // Update document content reference when the parent component updates it
  useEffect(() => {
    const fetchInitialDocument = async () => {
      try {
        let doc = '';
        if (type === 'plan') {
          doc = await getPlanDocument(projectId) || '';
        } else if (type === 'technicalSpecs') {
          doc = await getTechSpecDocument(projectId) || '';
        } else if (type === 'issue') {
          // For issues, we don't need to fetch a document
          doc = '';
        }
        documentContentRef.current = doc;
      } catch (err: any) {
        console.error('Failed to load document:', err);
        documentContentRef.current = '';
      }
    };
    if (isOpen) fetchInitialDocument();
  }, [projectId, type, isOpen]);

  const handleSendMessage = (content: string) => {
    if (!projectId || !type || isSendingMessage || !chatbot) return;
    setIsSendingMessage(true);
    isFirstFileChunk.current = true;
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
    setConversation((prev) => {
      const updatedMessages = prev ? [...prev.messages, userMessage, aiMessagePlaceholder] : [userMessage, aiMessagePlaceholder];
      return {
        id: prev?.id || `conv-${Date.now()}`,
        projectId,
        type,
        messages: updatedMessages,
      };
    });
    abortControllerRef.current?.abort();
    abortControllerRef.current = chatbot.sendMessage(
      type,
      content,
      conversation?.messages?.filter(msg => !msg.streaming).map(msg => ({ [msg.sender]: msg.content })) || [],
      (chunk) => {
        if (chunk.file && onDiffChange && type !== 'issue') {
          if (isFirstFileChunk.current) {
            // First chunk - initialize the diff view
            onDiffChange(true, documentContentRef.current, chunk.file, true);
            isFirstFileChunk.current = false;
          } else {
            // For subsequent chunks, we need to append to the existing content
            onDiffChange(true, documentContentRef.current, chunk.file, false);
          }
        }
        
        // Handle issues if they're present in the chunk (for issue type)
        if (chunk.issues && type === 'issue') {
          // You can handle issues here if needed
          console.log('Received issues:', chunk.issues);
        }
        
        setConversation((prev) => prev ? {
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === aiMessagePlaceholder.id
              ? { ...msg, content: msg.content + (chunk.message || '') }
              : msg
          )
        } : prev);
      },
      (err: Error) => {
        console.error('Error receiving response:', err);
        setConversation((prev) => prev ? {
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === aiMessagePlaceholder.id
              ? { ...msg, content: `Error receiving response: ${err.message}`, streaming: false }
              : msg
          )
        } : prev);
        setIsSendingMessage(false);
        abortControllerRef.current = null;
      },
      () => {
        setConversation((prev) => prev ? {
          ...prev,
          messages: prev.messages.map((msg) =>
            msg.id === aiMessagePlaceholder.id
              ? { ...msg, streaming: false }
              : msg
          )
        } : prev);
        setIsSendingMessage(false);
        abortControllerRef.current = null;
      }
    );
  };



  return (
    <div className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-lg z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold">{type === 'issue' ? 'Issue Chat' : 'AI Chat'}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex flex-col h-[calc(100vh-56px)]">
        {/* チャット */}
        <div className="flex-1 overflow-y-auto">
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

export default ChatSidePanel;
