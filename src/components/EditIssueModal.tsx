import React, { useState } from 'react';
import { Issue } from '../types';

interface EditIssueModalProps {
  issue: Issue;
  onClose: () => void;
  onSave: (updatedIssue: Issue) => void;
}

const EditIssueModal: React.FC<EditIssueModalProps> = ({ issue, onClose, onSave }) => {
  const [editedIssue, setEditedIssue] = useState<Issue>(issue);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedIssue(prev => ({ ...prev, [name]: value }));
  };

  const handlePriorityChange = (priority: 'low' | 'medium' | 'high') => {
    setEditedIssue(prev => ({ ...prev, priority }));
  };

  const handleSave = () => {
    onSave(editedIssue);
    onClose();
  };

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Issue</h3>
              <div className="mt-2">
                <div className="mb-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={editedIssue.title}
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
                    value={editedIssue.description}
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
                        checked={editedIssue.priority === 'low'}
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
                        checked={editedIssue.priority === 'medium'}
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
                        checked={editedIssue.priority === 'high'}
                        onChange={() => handlePriorityChange('high')}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <label htmlFor="priority-high" className="ml-3 block text-sm font-medium text-gray-700">
                        High
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleSave}
            >
              Save
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditIssueModal;
