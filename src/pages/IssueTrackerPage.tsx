import React, { useState } from 'react';
import Header from '../components/Header';
import EditIssueModal from '../components/EditIssueModal';

interface Issue {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

const IssueTrackerPage: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [newIssue, setNewIssue] = useState<Issue>({
    id: '',
    title: '',
    description: '',
    priority: 'medium',
  });
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewIssue(prev => ({ ...prev, [name]: value }));
  };

  const handlePriorityChange = (priority: 'low' | 'medium' | 'high') => {
    setNewIssue(prev => ({ ...prev, priority }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newIssueId = `issue-${Date.now()}`;
    const newIssueData: Issue = { ...newIssue, id: newIssueId };
    setIssues(prev => [...prev, newIssueData]);
    setNewIssue({ id: '', title: '', description: '', priority: 'medium' });
  };
  const handleEditIssue = (issue: Issue) => {
    setEditingIssue(issue);
  };

  const handleSaveEditedIssue = (updatedIssue: Issue) => {
    setIssues((prevIssues: Issue[]) =>
      prevIssues.map(issue =>
        issue.id === updatedIssue.id ? updatedIssue : issue
      )
    );
    setEditingIssue(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Issue Tracker" />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Issue</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newIssue.title}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={newIssue.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <div className="mt-1">
                  <div className="inline-flex items-center">
                    <input
                      type="radio"
                      id="priority-low"
                      name="priority"
                      value="low"
                      checked={newIssue.priority === 'low'}
                      onChange={() => handlePriorityChange('low')}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="priority-low" className="ml-3 block text-sm font-medium text-gray-700">
                      Low
                    </label>
                  </div>
                  <div className="inline-flex items-center ml-4">
                    <input
                      type="radio"
                      id="priority-medium"
                      name="priority"
                      value="medium"
                      checked={newIssue.priority === 'medium'}
                      onChange={() => handlePriorityChange('medium')}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="priority-medium" className="ml-3 block text-sm font-medium text-gray-700">
                      Medium
                    </label>
                  </div>
                  <div className="inline-flex items-center ml-4">
                    <input
                      type="radio"
                      id="priority-high"
                      name="priority"
                      value="high"
                      checked={newIssue.priority === 'high'}
                      onChange={() => handlePriorityChange('high')}
                      className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="priority-high" className="ml-3 block text-sm font-medium text-gray-700">
                      High
                    </label>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Issue
              </button>
            </form>
          </div>

          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing Issues</h2>
            {issues.length === 0 ? (
              <p className="text-gray-500">No issues created yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {issues.map(issue => (
                  <li key={issue.id} className="py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{issue.title}</h3>
                        <p className="text-sm text-gray-500">{issue.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              issue.priority === 'low'
                                ? 'bg-green-100 text-green-800'
                                : issue.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {issue.priority}
                          </span>
                          <button
                            onClick={() => handleEditIssue(issue)}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
