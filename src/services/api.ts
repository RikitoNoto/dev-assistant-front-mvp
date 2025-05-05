import { Project } from '../types'; // Import Project type
type StreamCallback = (data: { message?: string; file?: string }) => void;
type ErrorCallback = (error: any) => void;
type CloseCallback = () => void;

export const sendStreamingMessage = (
  type: 'plan' | 'technicalSpecs',
  messageContent: string,
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
        body: JSON.stringify({ message: messageContent, project_id: projectId }),
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

// Function to fetch projects from the API
export const getProjects = async (): Promise<Project[]> => {
  try {
    const response = await fetch(`/projects`); // Use the correct endpoint

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const apiProjects: ApiProject[] = await response.json();

    // Map API response to the frontend Project type
    const projects: Project[] = apiProjects.map(apiProject => ({
      id: apiProject.project_id,
      name: apiProject.title,
      description: '', // Provide a default empty string for description
      createdAt: apiProject.created_at,
      updatedAt: apiProject.updated_at,
      // thumbnail is optional and not provided by the API, so it's omitted
    }));

    return projects;
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    // In a real app, you might want to handle this error more gracefully,
    // e.g., by returning an empty array or showing an error message to the user.
    return []; // Return empty array on error for now
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

// Function to fetch the plan document from the API
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
    return null; // Return null on error
  }
};

// Function to fetch the technical specification document from the API
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
    return null; // Return null on error
  }
};
