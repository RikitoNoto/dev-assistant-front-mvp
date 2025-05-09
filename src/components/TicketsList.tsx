import React from 'react';
import { Ticket } from '../types';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface TicketsListProps {
  tickets: Ticket[];
}

const TicketsList: React.FC<TicketsListProps> = ({ tickets }) => {
  // Group tickets by status
  const ticketsByStatus = {
    todo: tickets.filter(ticket => ticket.status === 'todo'),
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

  const statusColors = {
    todo: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    review: 'bg-yellow-100 text-yellow-800',
    done: 'bg-green-100 text-green-800'
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
                  key={ticket.id}
                  className="p-3 bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-gray-900">{ticket.title}</h4>
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