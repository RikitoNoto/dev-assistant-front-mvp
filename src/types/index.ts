export interface Issue extends Ticket {
  priority: NonNullable<Ticket['priority']>; // 'low' | 'medium' | 'high'
}

export interface Conversation {
  id: string;
  projectId: string;
  type: 'plan' | 'technicalSpecs';
  messages: Message[];
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  streaming?: boolean;
}

export interface Ticket {
  project_id: string;
  issue_id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  assignee?: string;
  comments: Comment[];
  priority: 'low' | 'medium' | 'high';
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  timestamp: string;
}
