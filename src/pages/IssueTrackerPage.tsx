import React, { useState, useEffect } from 'react';
import { useParams} from 'react-router-dom';
import Header from '../components/Header';
import TicketsList from '../components/TicketsList';
import ChatInterface from '../components/ChatInterface';
import EditIssueModal from '../components/EditIssueModal';
import { Ticket, Message, Issue } from '../types';
import { getIssues, sendStreamingMessage } from '../services/api';

interface IssueTrackerPageProps {
  projectId: string;
}

const IssueTrackerPage: React.FC<IssueTrackerPageProps> = () => {

  const { projectId } = useParams<{ projectId: string;}>() ;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [editingIssue, setEditingIssue] = useState<Ticket | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        if (!projectId) return;
        const fetchedTickets = await getIssues(projectId);
        setTickets((fetchedTickets || []).map(ticket => ({
          ...ticket,
          priority: ticket.priority || 'medium'
        })));
      } catch (error) {
        console.error('Failed to fetch tickets:', error);
      }
    };

    fetchTickets();
  }, [projectId]);

  const handleChatSubmit = (message: string) => {
    if (!projectId) return;
    setIsLoading(true);

    // ユーザーのメッセージを追加
    const userMessage: Message = {
      id: `message-${Date.now()}`,
      content: message,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, userMessage]);

    // AIとの通信を開始
    const controller = sendStreamingMessage(
      'issue',
      message,
      chatMessages.map(msg => ({ [msg.id]: msg.content })),
      projectId,
      (data) => {
        if (data.message) {
          setChatMessages(prev => [...prev, {
            id: `message-${Date.now()}`,
            content: data.message,
            sender: 'ai',
            timestamp: new Date().toISOString()
          } as Message]);
        }
        if (data.issues) {
          setTickets(data.issues);
        }
      },
      (error) => {
        console.error('AIとの通信エラー:', error);
      },
      () => {
        setIsLoading(false);
      }
    );

    // AIとの通信をキャンセルできるように
    return () => {
      controller.abort();
    };
  };

  // チケット編集の保存処理
  const handleSaveEditedIssue = (updatedIssue: Issue) => {
    setTickets(prev => 
      prev.map(ticket => 
        ticket.project_id === updatedIssue.project_id ? { 
          ...ticket, 
          ...updatedIssue
        } : ticket
      )
    );
    setEditingIssue(null);
  };

  const handleEditIssue = (ticket: Ticket) => {
    setEditingIssue(ticket);
  };

  // チケットのステータス変更を処理する関数
  const handleTicketStatusChange = (ticketId: string, newStatus: Ticket['status']) => {
    setTickets(prev => 
      prev.map(ticket => 
        ticket.issue_id === ticketId ? { 
          ...ticket, 
          status: newStatus
        } : ticket
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Issue Tracker" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* チケットリスト */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tickets</h2>
            <TicketsList 
              tickets={tickets}
              onStatusChange={handleTicketStatusChange}
            />
          </div>

          {/* AIとの会話画面 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Chat with AI</h2>
            <ChatInterface
              messages={chatMessages}
              onSendMessage={handleChatSubmit}
              isLoading={isLoading}
            />
          </div>

          {editingIssue && (
            <EditIssueModal
              issue={editingIssue}
              onClose={() => setEditingIssue(null)}
              onSave={handleSaveEditedIssue}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default IssueTrackerPage;

// AIからのストリームデータの型定義
interface StreamData {
  message?: string;
  issues?: Ticket[];
}
