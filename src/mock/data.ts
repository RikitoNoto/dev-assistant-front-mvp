import { Project, ProjectDetails, Conversation } from '../types';

export const projects: Project[] = [
  {
    id: '1',
    name: 'E-commerce Platform',
    description: 'A comprehensive e-commerce solution with product management, cart, and checkout.',
    createdAt: '2025-01-15T12:00:00Z',
    updatedAt: '2025-03-10T15:30:00Z',
    thumbnail: 'https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: '2',
    name: 'Task Management App',
    description: 'Kanban-style task management system with team collaboration features.',
    createdAt: '2025-02-22T09:15:00Z',
    updatedAt: '2025-03-15T11:45:00Z',
    thumbnail: 'https://images.pexels.com/photos/7376/startup-photos.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  },
  {
    id: '3',
    name: 'Social Media Dashboard',
    description: 'Analytics dashboard for tracking performance across social media platforms.',
    createdAt: '2025-03-05T14:20:00Z',
    updatedAt: '2025-03-18T16:10:00Z',
    thumbnail: 'https://images.pexels.com/photos/6804604/pexels-photo-6804604.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
  }
];

export const projectDetails: Record<string, ProjectDetails> = {
  '1': {
    id: '1',
    plan: `# E-commerce Platform Plan

## Overview
An e-commerce platform that allows businesses to sell products online with a modern, responsive interface.

## Key Features
- Product catalog with categories and search
- User accounts and profiles
- Shopping cart and checkout process
- Order history and tracking
- Admin dashboard for product and order management

## Project Timeline
- Sprint 1: User authentication and product catalog
- Sprint 2: Shopping cart and checkout functionality
- Sprint 3: User profiles and order history
- Sprint 4: Admin dashboard and analytics`,
    technicalSpecs: `# Technical Specifications

## Frontend
- React with TypeScript
- Redux for state management
- Tailwind CSS for styling
- Responsive design for mobile and desktop

## Backend
- Node.js with Express
- MongoDB for data storage
- RESTful API architecture
- JWT for authentication

## Infrastructure
- Deployed on AWS (EC2, S3)
- CI/CD pipeline with GitHub Actions
- Image storage on S3
- Payment processing with Stripe API

## Security Considerations
- HTTPS for all connections
- Input validation and sanitization
- XSS and CSRF protection
- Rate limiting for API endpoints`,
    tickets: [
      {
        id: 't1',
        title: 'Set up project structure',
        description: 'Initialize React project with TypeScript and configure build system',
        status: 'done',
        priority: 'high',
        assignee: 'User',
        createdAt: '2025-01-16T10:00:00Z',
        updatedAt: '2025-01-17T14:30:00Z'
      },
      {
        id: 't2',
        title: 'Implement user authentication',
        description: 'Create login, registration, and password recovery flows',
        status: 'in-progress',
        priority: 'high',
        assignee: 'User',
        createdAt: '2025-01-18T09:15:00Z',
        updatedAt: '2025-01-22T11:45:00Z'
      },
      {
        id: 't3',
        title: 'Create product listing page',
        description: 'Implement grid view for products with filtering and sorting options',
        status: 'todo',
        priority: 'medium',
        createdAt: '2025-01-20T13:20:00Z',
        updatedAt: '2025-01-20T13:20:00Z'
      },
      {
        id: 't4',
        title: 'Design shopping cart UI',
        description: 'Create responsive cart interface with product images, quantities, and prices',
        status: 'todo',
        priority: 'medium',
        createdAt: '2025-01-21T16:10:00Z',
        updatedAt: '2025-01-21T16:10:00Z'
      },
      {
        id: 't5',
        title: 'Implement checkout process',
        description: 'Create multi-step checkout with address, payment, and confirmation screens',
        status: 'todo',
        priority: 'high',
        createdAt: '2025-01-22T11:05:00Z',
        updatedAt: '2025-01-22T11:05:00Z'
      }
    ]
  },
  '2': {
    id: '2',
    plan: `# Task Management App Plan

## Overview
A Kanban-style task management application for teams to track progress on projects and collaborate effectively.

## Key Features
- Kanban board with customizable columns
- Task creation with descriptions, assignees, and due dates
- Team collaboration with comments and notifications
- Project and team management
- Time tracking and reporting

## Project Timeline
- Sprint 1: Board setup and basic task management
- Sprint 2: User management and team features
- Sprint 3: Comments, notifications, and activity feed
- Sprint 4: Advanced features and integrations`,
    technicalSpecs: `# Technical Specifications

## Frontend
- React with TypeScript
- Context API for state management
- Tailwind CSS for styling
- Drag-and-drop functionality with react-beautiful-dnd

## Backend
- Node.js with Express
- PostgreSQL database
- RESTful API with WebSocket for real-time updates
- JWT for authentication

## Infrastructure
- Deployed on Vercel
- Database hosted on Supabase
- CI/CD with GitHub Actions
- Notifications via email and in-app

## Security Considerations
- HTTPS for all connections
- Data encryption at rest
- Role-based access control
- Regular security audits`,
    tickets: [
      {
        id: 't1',
        title: 'Design database schema',
        description: 'Create entities and relationships for users, projects, boards, and tasks',
        status: 'done',
        priority: 'high',
        assignee: 'User',
        createdAt: '2025-02-23T10:00:00Z',
        updatedAt: '2025-02-24T16:30:00Z'
      },
      {
        id: 't2',
        title: 'Implement authentication',
        description: 'Set up user registration, login, and JWT token management',
        status: 'done',
        priority: 'high',
        assignee: 'User',
        createdAt: '2025-02-25T09:15:00Z',
        updatedAt: '2025-02-28T14:20:00Z'
      },
      {
        id: 't3',
        title: 'Create Kanban board UI',
        description: 'Design and implement the drag-and-drop Kanban board interface',
        status: 'in-progress',
        priority: 'medium',
        assignee: 'User',
        createdAt: '2025-03-01T13:20:00Z',
        updatedAt: '2025-03-05T17:10:00Z'
      },
      {
        id: 't4',
        title: 'Implement task creation modal',
        description: 'Create form for adding new tasks with all required fields',
        status: 'todo',
        priority: 'medium',
        createdAt: '2025-03-06T11:05:00Z',
        updatedAt: '2025-03-06T11:05:00Z'
      },
      {
        id: 't5',
        title: 'Set up WebSocket for real-time updates',
        description: 'Implement real-time updates when tasks are created or moved',
        status: 'todo',
        priority: 'high',
        createdAt: '2025-03-07T15:30:00Z',
        updatedAt: '2025-03-07T15:30:00Z'
      }
    ]
  },
  '3': {
    id: '3',
    plan: `# Social Media Dashboard Plan

## Overview
An analytics dashboard for tracking performance across multiple social media platforms in one centralized location.

## Key Features
- Integration with major social media APIs (Twitter, Facebook, Instagram, LinkedIn)
- Customizable widgets and dashboard layout
- Performance metrics and trend analysis
- Scheduled reporting and exports
- Competitor analysis

## Project Timeline
- Sprint 1: Dashboard UI and basic metrics
- Sprint 2: Social media API integrations
- Sprint 3: Advanced analytics and reporting
- Sprint 4: Competitor analysis and recommendations`,
    technicalSpecs: `# Technical Specifications

## Frontend
- React with TypeScript
- Redux Toolkit for state management
- Recharts for data visualization
- Material UI component library

## Backend
- Node.js with Express
- MongoDB for user data
- Redis for caching API responses
- Bull for handling background jobs

## Infrastructure
- Deployed on DigitalOcean App Platform
- MongoDB Atlas for database
- Redis Cloud for caching
- CI/CD with CircleCI

## Security Considerations
- OAuth for social media platform integrations
- API rate limiting
- Data encryption for stored credentials
- Regular security audits`,
    tickets: [
      {
        id: 't1',
        title: 'Design dashboard layout',
        description: 'Create wireframes and mockups for the main dashboard interface',
        status: 'done',
        priority: 'high',
        assignee: 'User',
        createdAt: '2025-03-06T10:00:00Z',
        updatedAt: '2025-03-08T15:45:00Z'
      },
      {
        id: 't2',
        title: 'Implement Twitter API integration',
        description: 'Connect to Twitter API and retrieve follower count, engagement, and reach metrics',
        status: 'in-progress',
        priority: 'high',
        assignee: 'User',
        createdAt: '2025-03-09T09:15:00Z',
        updatedAt: '2025-03-12T16:30:00Z'
      },
      {
        id: 't3',
        title: 'Create metrics visualization components',
        description: 'Build reusable chart components for displaying different types of metrics',
        status: 'in-progress',
        priority: 'medium',
        assignee: 'User',
        createdAt: '2025-03-10T13:20:00Z',
        updatedAt: '2025-03-14T17:10:00Z'
      },
      {
        id: 't4',
        title: 'Implement user authentication',
        description: 'Set up login and registration with role-based access control',
        status: 'todo',
        priority: 'high',
        createdAt: '2025-03-11T11:05:00Z',
        updatedAt: '2025-03-11T11:05:00Z'
      },
      {
        id: 't5',
        title: 'Build scheduled reporting feature',
        description: 'Create functionality to generate and email reports on a schedule',
        status: 'todo',
        priority: 'medium',
        createdAt: '2025-03-12T15:30:00Z',
        updatedAt: '2025-03-12T15:30:00Z'
      }
    ]
  }
};

export const conversations: Record<string, Record<string, Conversation>> = {
  '1': {
    'plan': {
      id: 'conv1',
      projectId: '1',
      type: 'plan',
      messages: [
        {
          id: 'm1',
          content: 'Can you help me refine the e-commerce platform plan?',
          sender: 'user',
          timestamp: '2025-03-08T14:25:00Z'
        },
        {
          id: 'm2',
          content: 'Of course! What specific aspects of the plan would you like to improve?',
          sender: 'ai',
          timestamp: '2025-03-08T14:25:30Z'
        },
        {
          id: 'm3',
          content: 'I think we should add a feature for product reviews and ratings.',
          sender: 'user',
          timestamp: '2025-03-08T14:26:15Z'
        },
        {
          id: 'm4',
          content: "That's a great addition. Product reviews and ratings can significantly enhance user trust and improve conversion rates. I'll update the plan to include this feature. Would you like to add it to an existing sprint or create a new sprint for this feature?",
          sender: 'ai',
          timestamp: '2025-03-08T14:27:00Z'
        },
        {
          id: 'm5',
          content: 'Let\'s add it to Sprint 3 along with user profiles.',
          sender: 'user',
          timestamp: '2025-03-08T14:28:10Z'
        },
        {
          id: 'm6',
          content: "I've updated Sprint 3 to include product reviews and ratings. This fits well with the user profiles work as both features are user-centered. The updated plan now includes:\n\nSprint 3: User profiles, order history, and product reviews/ratings\n\nIs there anything else you'd like to modify in the plan?",
          sender: 'ai',
          timestamp: '2025-03-08T14:29:30Z'
        }
      ]
    },
    'technicalSpecs': {
      id: 'conv2',
      projectId: '1',
      type: 'technicalSpecs',
      messages: [
        {
          id: 'm1',
          content: 'I\'m concerned about the payment processing security. Can we enhance that section?',
          sender: 'user',
          timestamp: '2025-03-10T10:15:00Z'
        },
        {
          id: 'm2',
          content: 'That\'s a valid concern. Payment security is critical for e-commerce platforms. Let me suggest some enhancements to the payment processing section.',
          sender: 'ai',
          timestamp: '2025-03-10T10:15:45Z'
        },
        {
          id: 'm3',
          content: 'Here are recommended security enhancements for payment processing:\n\n1. Use Stripe Elements for secure credit card collection\n2. Implement 3D Secure authentication for additional fraud prevention\n3. Store no payment details on our servers - rely entirely on Stripe\'s PCI-compliant infrastructure\n4. Add transaction monitoring for suspicious activity\n5. Implement purchase amount limits for new accounts\n\nWould you like me to add these to the technical specifications?',
          sender: 'ai',
          timestamp: '2025-03-10T10:18:00Z'
        },
        {
          id: 'm4',
          content: 'Yes, please add all of those. Also, should we consider adding PayPal as an alternative payment method?',
          sender: 'user',
          timestamp: '2025-03-10T10:20:30Z'
        },
        {
          id: 'm5',
          content: 'Adding PayPal is an excellent idea. It provides users with payment options and can increase conversion rates. I\'ll add both the security enhancements and PayPal integration to the technical specifications.',
          sender: 'ai',
          timestamp: '2025-03-10T10:22:00Z'
        }
      ]
    }
  },
  '2': {
    'plan': {
      id: 'conv3',
      projectId: '2',
      type: 'plan',
      messages: [
        {
          id: 'm1',
          content: 'I think we should add a feature for time tracking in the task management app.',
          sender: 'user',
          timestamp: '2025-03-12T11:30:00Z'
        },
        {
          id: 'm2',
          content: 'Time tracking would be a valuable addition to the task management app. It would allow users to monitor how much time they spend on different tasks and projects.',
          sender: 'ai',
          timestamp: '2025-03-12T11:31:15Z'
        },
        {
          id: 'm3',
          content: 'Would you like me to update the plan to include a dedicated sprint for time tracking features, or should we integrate it into one of the existing sprints?',
          sender: 'ai',
          timestamp: '2025-03-12T11:32:30Z'
        },
        {
          id: 'm4',
          content: 'Let\'s add it to Sprint 4 with the advanced features.',
          sender: 'user',
          timestamp: '2025-03-12T11:34:00Z'
        },
        {
          id: 'm5',
          content: "I've updated the plan to include time tracking in Sprint 4. The revised Sprint 4 now covers:\n\n- Advanced features and integrations\n- Time tracking with reporting dashboard\n- API for external integrations\n\nThis will allow users to track time spent on tasks, generate reports, and analyze productivity patterns.",
          sender: 'ai',
          timestamp: '2025-03-12T11:36:30Z'
        }
      ]
    },
    'technicalSpecs': {
      id: 'conv4',
      projectId: '2',
      type: 'technicalSpecs',
      messages: [
        {
          id: 'm1',
          content: 'I\'m wondering if we should switch from PostgreSQL to MongoDB for the task management app.',
          sender: 'user',
          timestamp: '2025-03-14T15:45:00Z'
        },
        {
          id: 'm2',
          content: 'That\'s an interesting consideration. Let\'s compare PostgreSQL and MongoDB for your specific use case:\n\n**PostgreSQL Pros:**\n- Strong data integrity with relationships (important for users, tasks, projects)\n- ACID compliance for reliable transactions\n- Well-suited for structured data with clear relationships\n- Better for complex queries and reporting\n\n**MongoDB Pros:**\n- Flexible schema for evolving data models\n- Potentially better performance for read-heavy operations\n- Easier horizontal scaling\n- JSON-like document structure that maps well to JavaScript objects\n\nFor a task management app with clear relationships between entities (users, tasks, boards, comments), PostgreSQL is often a better fit. However, if you anticipate frequent schema changes or primarily need document storage, MongoDB could be advantageous.',
          sender: 'ai',
          timestamp: '2025-03-14T15:48:30Z'
        },
        {
          id: 'm3',
          content: 'That makes sense. Let\'s stick with PostgreSQL then, but can we add some information about optimizing it for performance?',
          sender: 'user',
          timestamp: '2025-03-14T15:51:00Z'
        },
        {
          id: 'm4',
          content: "Great decision. I'll add PostgreSQL optimization strategies to the technical specifications. Here are the optimization techniques I'll include:\n\n1. Proper indexing strategies for frequently queried fields\n2. Connection pooling to manage database connections efficiently\n3. Materialized views for complex, frequently-accessed reports\n4. Partitioning for large tables (like activity history)\n5. Regular VACUUM and ANALYZE maintenance\n6. Query optimization and monitoring\n7. Caching layer with Redis for frequently accessed data\n\nThese optimizations will help ensure good performance even as your data grows.",
          sender: 'ai',
          timestamp: '2025-03-14T15:54:30Z'
        }
      ]
    }
  }
};

export function getProjects(): Promise<Project[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(projects);
    }, 500);
  });
}

export function getProjectDetails(projectId: string): Promise<ProjectDetails | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(projectDetails[projectId] || null);
    }, 500);
  });
}

export function getConversationHistory(projectId: string, type: 'plan' | 'technicalSpecs'): Promise<Conversation | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(conversations[projectId]?.[type] || null);
    }, 500);
  });
}

export function sendMessage(projectId: string, type: 'plan' | 'technicalSpecs', content: string): Promise<Message> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newUserMessage: Message = {
        id: `m${Date.now()}`,
        content,
        sender: 'user',
        timestamp: new Date().toISOString()
      };
      
      // In a real app, we would send this to the backend and get an AI response
      // For now, we'll simulate an AI response
      
      const newAiMessage: Message = {
        id: `m${Date.now() + 1}`,
        content: `I've received your message about the ${type}. In a real application, this would be processed by an AI to provide a helpful response based on your input.`,
        sender: 'ai',
        timestamp: new Date(Date.now() + 1000).toISOString()
      };
      
      // In a real app, both messages would be added to the conversation history
      // Here we're just returning the user message for simplicity
      resolve(newUserMessage);
    }, 800);
  });
}

export function createProject(name: string, description: string): Promise<Project> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newProject: Project = {
        id: `${projects.length + 1}`,
        name,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        thumbnail: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
      };
      
      // In a real app, we would add this to the database
      // For now, we'll just return the new project
      resolve(newProject);
    }, 800);
  });
}