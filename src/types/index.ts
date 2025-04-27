export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
}

export interface ProjectDetails {
  id: string;
  plan: string;
  technicalSpecs: string;
  tickets: Ticket[];
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  streaming?: boolean;
}

export interface Conversation {
  id: string;
  projectId: string;
  type: 'plan' | 'technicalSpecs';
  messages: Message[];
}
