import { Project } from '../types'; // Import Project type

export interface ApiFunctions {
  sendStreamingMessage: typeof sendStreamingMessage;
  getPlanDocument: typeof getPlanDocument;
  getTechSpecDocument: typeof getTechSpecDocument;
  savePlanDocument: typeof savePlanDocument;
  saveTechSpecDocument: typeof saveTechSpecDocument;
}

type StreamCallback = (data: { message?: string; file?: string }) => void;
type ErrorCallback = (error: any) => void;
type CloseCallback = () => void;

type HistoryItem = { [key: string]: string };

export const sendStreamingMessage = (
  type: 'plan' | 'technicalSpecs',
  messageContent: string,
  history: HistoryItem[],
  projectId: string,
  onStreamUpdate: StreamCallback,
  onError: ErrorCallback,
  onClose: CloseCallback
): AbortController => {
  const url = type === 'plan'
    ? `/chat/plan/stream`
    : `/chat/tech-spec/stream`;

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
        chunk.match(/{.*?}/gs)?.forEach((v)=>{
          const json = JSON.parse(v);
            onStreamUpdate({...json});
        })
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

// Define the structure of the API response item
interface ApiProject {
  project_id: string;
  title: string;
  created_at: string;
  updated_at: string;
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
    }));

    return projects;
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return [];
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

// Define the structure for document API responses
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
