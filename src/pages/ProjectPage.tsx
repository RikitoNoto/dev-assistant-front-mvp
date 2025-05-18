import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Check, X, Loader2 } from 'lucide-react';
import ChatSidePanel from '../components/ChatSidePanel';
import Header from '../components/Header';
import ProjectTabs from '../components/ProjectTabs';
import MarkdownRenderer from '../components/MarkdownRenderer';
import TicketsList from '../components/TicketsList';
import { getPlanDocument, getTechSpecDocument, savePlanDocument, saveTechSpecDocument, getIssues, saveIssues, deleteIssue } from '../services/api';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { Ticket } from '../types';

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('plan');
  const [planContent, setPlanContent] = useState<string | null>(null);
  const [techSpecContent, setTechSpecContent] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // チャットサイドパネル用の状態
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatType, setActiveChatType] = useState<'plan' | 'technicalSpecs' | 'issue' | null>(null);
  
  // Diff view state
  const [showDiff, setShowDiff] = useState(false);
  const [originalContent, setOriginalContent] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingTicket, setIsProcessingTicket] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [issueContent, setIssueContent] = useState<string>('');

  const fetchAllData = async () => {
    if (!projectId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [planData, techSpecData, ticketsData] = await Promise.all([
        getPlanDocument(projectId),
        getTechSpecDocument(projectId),
        getIssues(projectId)
      ]);

      setPlanContent(planData);
      setTechSpecContent(techSpecData);
      setTickets(ticketsData || []);

      if (planData === null || techSpecData === null) {
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
  useEffect(() => {

    fetchAllData();
  }, [projectId]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Clear diff view when changing tabs
    setShowDiff(false);
    setOriginalContent('');
    setNewContent('');
  };

  // サイドパネルでチャットを開く
  const handleOpenChat = (type: 'plan' | 'technicalSpecs' | 'issue') => {
    setActiveChatType(type);
    setIsChatOpen(true);
  };
  
  // Handle diff changes from ChatSidePanel
  const handleDiffChange = (showDiff: boolean, originalContent: string, newContentChunk: string, isFirstChunk: boolean = true) => {
    setShowDiff(showDiff);
    setOriginalContent(originalContent);
    // If it's the first chunk, replace the content, otherwise append
    if (isFirstChunk) {
      setNewContent(newContentChunk);
    } else {
      setNewContent(prev => prev + newContentChunk);
    }
  };

  const handleDiffChangeIssue = (showDiff: boolean, originalContent: string, newContentChunk: string, isFirstChunk: boolean = true) => {

    // If it's the first chunk, replace the content, otherwise append
    if (isFirstChunk) {
      setIssueContent(newContentChunk);
    } else {
      setIssueContent(prev => prev + newContentChunk);
    }
  }
    

  // Handle accepting diff changes
  const handleAcceptDiff = async () => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      if (activeTab === 'plan') {
        await savePlanDocument(projectId || '', newContent);
        setPlanContent(newContent);
      } else if (activeTab === 'specs') {
        await saveTechSpecDocument(projectId || '', newContent);
        setTechSpecContent(newContent);
      }
      
      // Reset diff view
      setShowDiff(false);
      setOriginalContent('');
      setNewContent('');
    } catch (err: any) {
      console.error('Error saving document:', err);
      setSaveError(err.message || 'Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle rejecting diff changes
  const handleRejectDiff = () => {
    setShowDiff(false);
    setOriginalContent('');
    setNewContent('');
  };

  // Handle accepting ticket changes (add or remove)
  const handleAcceptTicket = async (ticket: Ticket | { type: 'add' | 'remove'; id?: string; title?: string }) => {
    if (!projectId) return;
    
    setIsProcessingTicket(true);
    
    try {
      // Handle new ticket creation
      if ('type' in ticket && ticket.type === 'add') {
        if(!ticket.title) return;
        
        // Create a new ticket with the title from the id field
        const newTicket: Ticket = {
          project_id: projectId,
          issue_id: "",
          title: ticket.title,
          description: '',
          status: 'todo',
          priority: 'medium',
          comments: []
        };
        
        // Call the API to create the ticket
        await saveIssues(projectId, newTicket);
        
        // Update the tickets state with the new ticket
        fetchAllData();
        
        // Clean up the issueContent by removing the processed ticket
        // Use exact matching to ensure we only remove the specific ticket
        setIssueContent(prev => {
          const lines = prev.split('\n');
          return lines.filter(line => {
            // Only keep lines that don't exactly match the format "+ticketTitle"
            const trimmedLine = line.trim();
            if (!ticket.title) return true;
            return !trimmedLine.includes(ticket.title);
          }).join('\n');
        });
      }
      // Handle ticket deletion
      else if ('type' in ticket && ticket.type === 'remove') {
        if(!ticket.id) return;
        
        // Call the API to delete the ticket
        await deleteIssue(projectId, ticket.id);
        
        // Update the tickets state by removing the deleted ticket
        setTickets(prev => prev.filter(t => t.issue_id !== ticket.id));
        
        // Clean up the issueContent by removing the processed ticket
        // Use exact matching to ensure we only remove the specific ticket
        setIssueContent(prev => {
          const lines = prev.split('\n');
          return lines.filter(line => {
            // Only keep lines that don't exactly match the format "-ticketId"
            const trimmedLine = line.trim();
            if (!ticket.id) return true;
            return trimmedLine !== `-${ticket.id}`;
          }).join('\n');
        });
      }
    } catch (error: any) {
      console.error('Error processing ticket operation:', error);
      setSaveError(error.message || 'Failed to process ticket operation');
    } finally {
      setIsProcessingTicket(false);
    }
  };
  
  // Handle rejecting ticket changes (add or remove)
  const handleRejectTicket = (ticket: Ticket | { type: 'add' | 'remove'; id?: string; title?: string }) => {
    // 拒否した場合は、単にissueContentから該当行を削除する
    if ('type' in ticket) {
      if (ticket.type === 'add' && ticket.title) {
        setIssueContent(prev => prev.split('\n')
          .filter(line => !(line.startsWith('+') && line.slice(1).trim() === ticket.title))
          .join('\n'));
      } else if (ticket.type === 'remove' && ticket.id) {
        setIssueContent(prev => prev.split('\n')
          .filter(line => !(line.startsWith('-') && line.slice(1).trim() === ticket.id))
          .join('\n'));
      }
    }
  };

  // チケットのステータス変更を処理する関数
  const handleTicketStatusChange = async (ticketId: string, newStatus: Ticket['status']) => {
    if (!projectId) return;
    
    try {
      setIsProcessingTicket(true);
      
      // 更新対象のチケットを見つける
      const ticketToUpdate = tickets.find(ticket => ticket.issue_id === ticketId);
      if (!ticketToUpdate) {
        throw new Error('チケットが見つかりませんでした。');
      }
      
      // 更新されたチケット情報
      const updatedTicket: Ticket = {
        ...ticketToUpdate,
        status: newStatus
      };
      
      // ローカルの状態を更新
      setTickets(prev => prev.map(ticket => 
        ticket.issue_id === ticketId ? updatedTicket : ticket
      ));
      
      // APIを呼び出してサーバー側も更新
      await saveIssues(projectId, updatedTicket);
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      setSaveError('チケットのステータス更新に失敗しました。');
      
      // エラーが発生した場合は元の状態に戻す
      const originalTicket = tickets.find(t => t.issue_id === ticketId);
      if (originalTicket) {
        setTickets(prev => prev.map(ticket => 
          ticket.issue_id === ticketId ? originalTicket : ticket
        ));
      }
    } finally {
      setIsProcessingTicket(false);
    }
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

    // チャットサイドパネルを開くハンドラを利用

    switch (activeTab) {
      case 'plan':
        return (
          <div className="relative">
            <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-[200px]">
              {(isSaving || saveError) && (
                <div className={`mb-4 p-3 rounded-md border ${saveError ? 'bg-red-100 border-red-300 text-red-700' : 'bg-blue-100 border-blue-300 text-blue-700'}`}>
                  {isSaving && <><Loader2 className="h-4 w-4 mr-1 inline animate-spin" /> Saving...</>}
                  {saveError && `Save Error: ${saveError}`}
                </div>
              )}
              
              {showDiff && activeTab === 'plan' ? (
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
              ) : planContent !== null ? (
                <MarkdownRenderer content={planContent} />
              ) : (
                <p className="text-gray-500">Plan document not available.</p>
              )}
            </div>
            <button
              onClick={() => handleOpenChat('plan')}
              className="absolute top-4 right-4 p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Discuss with AI"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
          </div>
        );
      case 'specs':
        return (
          <div className="relative">
            <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-[200px]">
              {(isSaving || saveError) && (
                <div className={`mb-4 p-3 rounded-md border ${saveError ? 'bg-red-100 border-red-300 text-red-700' : 'bg-blue-100 border-blue-300 text-blue-700'}`}>
                  {isSaving && <><Loader2 className="h-4 w-4 mr-1 inline animate-spin" /> Saving...</>}
                  {saveError && `Save Error: ${saveError}`}
                </div>
              )}
              
              {showDiff && activeTab === 'specs' ? (
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
              ) : techSpecContent !== null ? (
                <MarkdownRenderer content={techSpecContent} />
              ) : (
                <p className="text-gray-500">Technical specifications document not available.</p>
              )}
            </div>
            <button
              onClick={() => handleOpenChat('technicalSpecs')}
              className="absolute top-4 right-4 p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Discuss with AI"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
          </div>
        );
      case 'tickets':
        return (
          <div className="relative">
            <div className="bg-white rounded-lg border border-gray-200 p-6 min-h-[200px]">
              {isProcessingTicket && (
                <div className="mb-4 p-3 rounded-md border bg-blue-100 border-blue-300 text-blue-700">
                  <Loader2 className="h-4 w-4 mr-1 inline animate-spin" /> Processing ticket operation...
                </div>
              )}
              <TicketsList
                tickets={tickets}
                newTicketTitles={issueContent.split('\n').filter(line => line.startsWith('+')).map(line => line.slice(1).trim())}
                removeTicketIds={issueContent.split('\n').filter(line => line.startsWith('-')).map(line => line.slice(1).trim())}
                onAccept={handleAcceptTicket}
                onReject={handleRejectTicket}
                onStatusChange={handleTicketStatusChange}
              />
            </div>
            <button
              onClick={() => handleOpenChat('issue')}
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

          {/* サイドパネル分の右マージンを追加 */}
          <div className={`mt-6 relative transition-all duration-300 ${isChatOpen ? 'mr-[400px]' : ''}`}>
            {renderTabContent()}
            {/* チャットサイドパネル */}
            <ChatSidePanel
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
              projectId={projectId || ''}
              type={activeChatType || 'plan'}
              onDiffChange={activeChatType === 'issue' ? handleDiffChangeIssue : handleDiffChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectPage;
