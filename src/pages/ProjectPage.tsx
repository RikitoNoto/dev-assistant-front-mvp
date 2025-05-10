import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageSquare, Check, X, Loader2 } from 'lucide-react';
import ChatSidePanel from '../components/ChatSidePanel';
import Header from '../components/Header';
import ProjectTabs from '../components/ProjectTabs';
import MarkdownRenderer from '../components/MarkdownRenderer';
import TicketsList from '../components/TicketsList';
import { getPlanDocument, getTechSpecDocument, savePlanDocument, saveTechSpecDocument, getIssues } from '../services/api';
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [issueContent, setIssueContent] = useState<string>('');

  useEffect(() => {
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
              <TicketsList tickets={tickets} />
            </div>
            <button
              onClick={() => handleOpenChat('issue')}
              className="absolute top-4 right-4 p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Edit in conversation"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
            <div>
              <h3>Add Issues</h3>
              {
              issueContent.split('\n').filter(line => line.startsWith('+')).map((issue, index) => (
                <div key={index}>{issue}</div>
              ))} 
            </div>
            <div>
              <h3>Remove Issues</h3>
              { 
              issueContent.split('\n').filter(line => line.startsWith('-')).map((issue, index) => (
                <div key={index}>{issue}</div>
              ))}
            </div>
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
