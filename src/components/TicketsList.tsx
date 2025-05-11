import React from 'react';
import { Ticket } from '../types';
import { Clock, AlertTriangle, CheckCircle, Check, X } from 'lucide-react';

interface TicketsListProps {
  tickets: Ticket[];
  newTicketTitles?: string[];  // New ticket titles to add
  removeTicketIds?: string[];  // IDs of tickets to remove
  onAccept?: (ticket: Ticket | { type: 'add' | 'remove'; id: string }) => void;
  onReject?: (ticket: Ticket | { type: 'add' | 'remove'; id: string }) => void;
}

const TicketsList: React.FC<TicketsListProps> = ({ tickets, newTicketTitles = [], removeTicketIds = [], onAccept, onReject }) => {
  // Create new ticket objects from newTicketTitles
  const newTickets: Ticket[] = newTicketTitles.map((title, index) => ({
    project_id: "",
    issue_id: "",
    title,
    description: '',
    status: 'todo' as const,
    priority: 'medium',
    comments: []
  }));

  // Group tickets by status and add new tickets to todo
  const ticketsByStatus = {
    todo: [...tickets.filter(ticket => ticket.status === 'todo'), ...newTickets],
    'in-progress': tickets.filter(ticket => ticket.status === 'in-progress'),
    review: tickets.filter(ticket => ticket.status === 'review'),
    done: tickets.filter(ticket => ticket.status === 'done')
  };

  const statusLabels = {
    todo: 'To Do',
    'in-progress': 'In Progress',
    review: 'In Review',
    done: 'Done'
  };

  const priorityIcons = {
    low: <Clock className="h-4 w-4 text-gray-400" />,
    medium: <Clock className="h-4 w-4 text-blue-500" />,
    high: <AlertTriangle className="h-4 w-4 text-red-500" />
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div key={status} className="p-4">
            <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              {status === 'done' && <CheckCircle className="h-4 w-4 text-green-500 mr-1" />}
              {label} <span className="ml-2 text-sm bg-gray-100 text-gray-700 py-0.5 px-2 rounded-full">{ticketsByStatus[status as keyof typeof ticketsByStatus].length}</span>
            </h3>
            
            <div className="space-y-3">
              {ticketsByStatus[status as keyof typeof ticketsByStatus].map(ticket => (
                <div 
                  key={ticket.project_id}
                  className={`p-3 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 ${
                    // 削除するチケットは赤色、新規チケットは緑色にする
                    removeTicketIds.includes(ticket.issue_id) 
                      ? 'bg-red-100 border-red-200' 
                      : ticket.issue_id === ""
                        ? 'bg-green-50 border-green-200 border-2 border-dashed'
                        : 'bg-white border border-gray-200'
                  }`}
                >
                  {/* 適用と拒否ボタンをタイトルの上に表示 */}
                  {((ticket.issue_id === "" && onAccept && onReject) || 
                   (removeTicketIds.includes(ticket.issue_id) && onAccept && onReject)) && (
                    <div className="flex space-x-1 mb-2 justify-end">
                      {/* 新規追加チケット用のボタン */}
                      {ticket.issue_id === "" && (
                        <>
                          <button
                            onClick={() => onAccept({ type: 'add', id: ticket.title })}
                            className="flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors border border-white"
                            title="追加を適用"
                          >
                            <Check className="h-3 w-3 mr-1" /> 適用
                          </button>
                          <button
                            onClick={() => onReject({ type: 'add', id: ticket.title })}
                            className="flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors border border-white"
                            title="追加を拒否"
                          >
                            <X className="h-3 w-3 mr-1" /> 拒否
                          </button>
                        </>
                      )}
                      
                      {/* 削除チケット用のボタン */}
                      {removeTicketIds.includes(ticket.issue_id) && (
                        <>
                          <button
                            onClick={() => onAccept({ type: 'remove', id: ticket.issue_id })}
                            className="flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors border border-white"
                            title="削除を適用"
                          >
                            <Check className="h-3 w-3 mr-1" /> 適用
                          </button>
                          <button
                            onClick={() => onReject({ type: 'remove', id: ticket.issue_id })}
                            className="flex items-center px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors border border-white"
                            title="削除を拒否"
                          >
                            <X className="h-3 w-3 mr-1" /> 拒否
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start">
                    <h4 className={`text-sm font-medium ${
                      ticket.issue_id === "" ? 'text-green-800' : removeTicketIds.includes(ticket.issue_id) ? 'text-red-800' : 'text-gray-900'
                    }`}>
                      {ticket.title}
                    </h4>
                  </div>
                  
                  <p className="mt-1 text-xs text-gray-600 line-clamp-2">{ticket.description}</p>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <div className="flex items-center">
                      {priorityIcons[ticket.priority]}
                      <span className="ml-1 text-xs text-gray-500 capitalize">{ticket.priority}</span>
                    </div>
                    
                    {ticket.assignee && (
                      <div className="flex items-center">
                        <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-xs text-indigo-800 font-medium">
                            {ticket.assignee[0]}
                          </span>
                        </div>
                        <span className="ml-1 text-xs text-gray-500">{ticket.assignee}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {ticketsByStatus[status as keyof typeof ticketsByStatus].length === 0 && (
                <div className="text-center p-4">
                  <p className="text-sm text-gray-500">No tickets</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketsList;
