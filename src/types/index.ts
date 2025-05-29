export interface Issue extends Ticket {
  priority: NonNullable<Ticket['priority']>; // 'low' | 'medium' | 'high'
}

export interface Conversation {
  id: string;
  projectId: string;
  type: 'plan' | 'technicalSpecs' | 'issue';
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
  isFromGitHub?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  githubProjId?: string;
}

export interface GitHubProject {
  id: string;
  name: string;
}
