import { Project, Ticket, GitHubProject } from '../types';

export interface ApiFunctions {
  sendStreamingMessage: typeof sendStreamingMessage;
  getPlanDocument: typeof getPlanDocument;
  getTechSpecDocument: typeof getTechSpecDocument;
  savePlanDocument: typeof savePlanDocument;
  saveTechSpecDocument: typeof saveTechSpecDocument;
  getIssues: typeof getIssues;
  saveIssues: typeof saveIssues;
  openProject: typeof openProject;
  getProject: typeof getProject;
  getGitHubProjects: typeof getGitHubProjects;
  connectProjectToGitHub: typeof connectProjectToGitHub;
  getGitHubIssues: typeof getGitHubIssues;
}

type StreamCallback = (data: { message?: string; file?: string; issues?: Ticket[] }) => void;
type ErrorCallback = (error: any) => void;
type CloseCallback = () => void;

type HistoryItem = { [key: string]: string };

export const sendIssueContentStreamingMessage = (
  issueId: string,
  messageContent: string,
  history: HistoryItem[],
  projectId: string,
  onStreamUpdate: StreamCallback,
  onError: ErrorCallback,
  onClose: CloseCallback,
  isFromGitHub?: boolean
): AbortController => {
  const url = isFromGitHub 
    ? `/chat/issue-content/github/${issueId}/stream`
    : `/chat/issue-content/${issueId}/stream`;
  const controller = new AbortController();
  const signal = controller.signal;

  const fetchData = async () => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageContent, history: history, project_id: projectId }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        // Try to extract valid JSON objects from the chunk
        const jsonMatches = chunk.match(/{.*?}/gs);
        if (jsonMatches) {
          for (const match of jsonMatches) {
            try {
              const json = JSON.parse(match);
              onStreamUpdate({...json});
            } catch (parseError) {
              console.warn('Failed to parse JSON chunk:', match);
              // Continue with other matches even if one fails
            }
          }
        }
        if (done) {
          break;
        }
      }

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        onError(error);
      }
    }
    finally {
      onClose();
    }
  };

  fetchData();
  return controller;
};

export const sendStreamingMessage = (
  type: 'plan' | 'technicalSpecs' | 'issue',
  messageContent: string,
  history: HistoryItem[],
  projectId: string,
  onStreamUpdate: StreamCallback,
  onError: ErrorCallback,
  onClose: CloseCallback
): AbortController => {
  const url = type === 'plan'
    ? `/chat/plan/stream`
    : type === 'technicalSpecs'
      ? `/chat/tech-spec/stream`
      : `/chat/issue-titles/stream`;

  const controller = new AbortController();
  const signal = controller.signal;

  const fetchData = async () => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageContent, history: history, project_id: projectId }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        // Try to extract valid JSON objects from the chunk
        const jsonMatches = chunk.match(/{.*?}/gs);
        if (jsonMatches) {
          for (const match of jsonMatches) {
            try {
              const json = JSON.parse(match);
              onStreamUpdate({...json});
            } catch (parseError) {
              console.warn('Failed to parse JSON chunk:', match);
              // Continue with other matches even if one fails
            }
          }
        }
        if (done) {
          break;
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        console.error('Fetch failed:', error);
        onError(error);
      }
    } finally {
      onClose();
    }
  };

  fetchData();

  return controller;
};

interface ApiProject {
  project_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_opened_at: string;
  github_project_id?: string;
}

export const getProjects = async (): Promise<Project[]> => {
  try {
    const response = await fetch(`/projects`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const apiProjects: ApiProject[] = await response.json();

    const projects: Project[] = apiProjects.map(apiProject => ({
      id: apiProject.project_id,
      name: apiProject.title,
      description: '',
      createdAt: apiProject.created_at,
      updatedAt: apiProject.updated_at,
      lastOpenedAt: apiProject.last_opened_at,
      githubProjId: apiProject.github_project_id,
    }));

    return projects;
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return [];
  }
};

export const getProject = async (projectId: string): Promise<Project | null> => {
  try {
    const response = await fetch(`/projects/${projectId}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const apiProject: ApiProject = await response.json();

    const project: Project = {
      id: apiProject.project_id,
      name: apiProject.title,
      description: '',
      createdAt: apiProject.created_at,
      updatedAt: apiProject.updated_at,
      lastOpenedAt: apiProject.last_opened_at,
      githubProjId: apiProject.github_project_id,
    };

    return project;
  } catch (error) {
    console.error(`Failed to fetch project ${projectId}:`, error);
    return null;
  }
};

export const savePlanDocument = async (projectId: string, content: string): Promise<void> => {
  try {
    const response = await fetch(`/documents/plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ project_id: projectId, content: content }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
  } catch (error) {
    console.error(`Failed to save plan document for project ${projectId}:`, error);
    throw error;
  }
};

export const saveTechSpecDocument = async (projectId: string, content: string): Promise<void> => {
  try {
    const response = await fetch(`/documents/tech-spec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ project_id: projectId, content: content }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
  } catch (error) {
    console.error(`Failed to save tech spec document for project ${projectId}:`, error);
    throw error;
  }
};

interface CreateProjectResponse {
  project_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const createProject = async (title: string): Promise<Project> => {
  try {
    const response = await fetch(`/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const apiProject: CreateProjectResponse = await response.json();

    const newProject: Project = {
      id: apiProject.project_id,
      name: apiProject.title,
      description: '',
      createdAt: apiProject.created_at,
      updatedAt: apiProject.updated_at,
    };

    return newProject;
  } catch (error) {
    console.error('Failed to create project:', error);
    throw error;
  }
};

interface DocumentResponse {
  project_id: string;
  content: string;
}

export const getPlanDocument = async (projectId: string): Promise<string | null> => {
  try {
    const response = await fetch(`/documents/plan/${projectId}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: DocumentResponse = await response.json();
    return data.content;
  } catch (error) {
    console.error(`Failed to fetch plan document for project ${projectId}:`, error);
    return null;
  }
};

export const getIssues = async (projectId: string): Promise<Ticket[] | null> => {
  try {
    const response = await fetch(`/issues/${projectId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return []; 
      }
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: Ticket[] = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch issues for project ${projectId}:`, error);
    return null;
  }
};


export interface SaveIssueResponse {
  issue_id: string;
  project_id: string;
  status: "success" | "error";
}

export interface GitHubIssueResponse {
  issue_id: string;
  github_issue_number: number;
  github_issue_url: string;
}

export const saveIssues = async (projectId: string, issue: Ticket): Promise<SaveIssueResponse | GitHubIssueResponse> => {
  if(!issue.issue_id || issue.issue_id === ''){
    return createIssue(projectId, issue);
  }else{
    return updateIssue(projectId, issue);
  }
}

const updateIssue = async (projectId: string, issue: Ticket): Promise<SaveIssueResponse | GitHubIssueResponse> => {
  try {
    if (issue.isFromGitHub) {
      const response = await fetch(`/issues/${projectId}/github/${issue.issue_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: issue.title,
          description: issue.description,
          project_status: issue.status
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return data;
    }else{
      const response = await fetch(`/issues/${projectId}/${issue.issue_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: issue.title,
          description: issue.description,
          project_status: issue.status
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error(`Failed to update issue for project ${projectId}:`, error);
    throw error;
  }
}

const createIssue = async (projectId: string, issue: Ticket): Promise<SaveIssueResponse | GitHubIssueResponse> => {
  try {
    const project = await getProject(projectId);
    
    if (project?.githubProjId) {
      const response = await fetch(`/issues/${projectId}/github`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: issue.title,
          description: issue.description,
          project_status: issue.status
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } else {
      // Proceed with local issue creation/update if not GitHub-connected
      const method = 'POST';
      const url = '/issues/';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          project_id: projectId,
          issue_id: issue.issue_id,
          title: issue.title,
          description: issue.description,
          status: issue.status,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error(`Failed to create issue for project ${projectId}:`, error);
    throw error;
  }
}

export const deleteIssue = async (projectId: string, issueId: string): Promise<void> => {
  try {
    const response = await fetch(`/issues/${projectId}/${issueId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
  } catch (error) {
    console.error(`Failed to delete issue ${issueId} for project ${projectId}:`, error);
    throw error;
  }
};

export const deleteGithubIssue = async (projectId: string, issueId: string): Promise<void> => {
  try {
    const response = await fetch(`/issues/${projectId}/github/${issueId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
  } catch (error) {
    console.error(`Failed to delete GitHub issue ${issueId} for project ${projectId}:`, error);
    throw error;
  }
};

export const getTechSpecDocument = async (projectId: string): Promise<string | null> => {
  try {
    const response = await fetch(`/documents/tech-spec/${projectId}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: DocumentResponse = await response.json();
    return data.content;
  } catch (error) {
    console.error(`Failed to fetch tech spec document for project ${projectId}:`, error);
    return null;
  }
};

/**
 * Records that a project has been opened/viewed.
 * This is used for sorting projects by last viewed date in the project list.
 * 
 * @param projectId - The ID of the project being opened
 * @returns A promise that resolves when the request completes
 */
export const openProject = async (projectId: string): Promise<void> => {
  try {
    const response = await fetch(`/projects/${projectId}/open`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
  } catch (error) {
    console.error(`Failed to record project open for project ${projectId}:`, error);
    // Not throwing the error since this is not a critical operation
  }
};

/**
 * Fetches available GitHub projects for integration
 * @returns A promise that resolves to an array of GitHub projects
 */
export const getGitHubProjects = async (): Promise<GitHubProject[]> => {
  try {
    const response = await fetch(`/projects/github/projects`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const githubProjects: GitHubProject[] = await response.json();
    return githubProjects;
  } catch (error) {
    console.error('Failed to fetch GitHub projects:', error);
    throw error;
  }
};

/**
 * Connects a project to a GitHub repository
 * @param projectId - The ID of the project to connect
 * @param githubProjId - The ID of the GitHub repository to connect to
 * @returns A promise that resolves when the connection is successful
 */
export const connectProjectToGitHub = async (projectId: string, githubProjId: string): Promise<void> => {
  try {
    const response = await fetch(`/projects/${projectId}/github`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ github_project_id: githubProjId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
  } catch (error) {
    console.error(`Failed to connect project ${projectId} to GitHub:`, error);
    throw error;
  }
};

/**
 * Fetches GitHub issues for a project
 * @param projectId - The ID of the project
 * @returns A promise that resolves to an array of tickets from GitHub
 */
export const getGitHubIssues = async (projectId: string): Promise<Ticket[] | null> => {
  try {
    const response = await fetch(`/issues/${projectId}/github`);

    if (!response.ok) {
      // If the project is not connected to GitHub or other error occurs
      if (response.status === 404) {
        console.log(`No GitHub connection found for project ${projectId}`);
        return null;
      }
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    
    // Transform GitHub issues to match the Ticket interface
    const tickets: Ticket[] = data.map((issue: any) => ({
      project_id: projectId,
      issue_id: issue.id,
      title: issue.title,
      description: issue.description || '',
      status: mapGitHubStateToStatus(issue),
      assignee: issue.assignee?.login,
      comments: issue.comments ? [{ id: issue.id, content: `${issue.comments} comments on GitHub`, author: 'GitHub', timestamp: new Date().toISOString() }] : [],
      priority: 'medium', // GitHub doesn't have a direct priority field, defaulting to medium
      isFromGitHub: true, // Flag to indicate this ticket is from GitHub
    }));

    return tickets;
  } catch (error) {
    console.error(`Failed to fetch GitHub issues for project ${projectId}:`, error);
    return null;
  }
};

/**
 * Maps GitHub issue state to the application's status format
 * @param state - GitHub issue state ('open' or 'closed')
 * @param stateReason - Reason for the state (e.g., 'completed', 'not_planned')
 * @returns Status in the application's format
 */
const mapGitHubStateToStatus = (issue: any): Ticket['status'] => {
  if (issue.project_status === "Todo"){
    return 'todo';
  }

  if (issue.project_status === "In Progress"){
    return 'in-progress';
  }

  if (issue.project_status === "Review"){
    return 'review';
  }

  if (issue.project_status === "Done" || issue.status === "CLOSED"){
    return 'done';
  }

  return 'todo'; // Default fallback
};
