import {
  getPlanDocument,
  getTechSpecDocument,
  savePlanDocument,
  saveTechSpecDocument,
  getIssues,      // Added for issues
  saveIssues,     // Added for issues
  ApiFunctions
} from '../services/api';
import { Ticket } from '../types'; // Added Ticket import

type DocumentApiFunctions = Pick<ApiFunctions, 'getPlanDocument' | 'getTechSpecDocument' | 'savePlanDocument' | 'saveTechSpecDocument'>;

// API functions specific to IssueDocumentModel
type IssueModelApiFunctions = Pick<ApiFunctions, 'getIssues' | 'saveIssues'>;

/**
 * ドキュメント操作の基本機能を提供する抽象クラス
 */
export abstract class DocumentModel {
  protected projectId: string;
  protected api: DocumentApiFunctions;

  constructor(projectId: string, apiFunctions: DocumentApiFunctions) {
    if (!projectId) {
      throw new Error("Project ID is required.");
    }
    this.projectId = projectId;
    this.api = apiFunctions;
  }

  /**
   * ドキュメントを取得する抽象メソッド
   * @returns ドキュメントの内容、または取得できなかった場合はnull
   */
  abstract getDocument(): Promise<string | null>;

  /**
   * ドキュメントを保存する抽象メソッド
   * @param content 保存する内容
   */
  abstract saveDocument(content: string): Promise<void>;
}

/**
 * Project Plan ドキュメント用モデル
 */
export class PlanDocumentModel extends DocumentModel {
  constructor(projectId: string, apiFunctions: Pick<ApiFunctions, 'getPlanDocument' | 'savePlanDocument'>) {
    super(projectId, {
        getPlanDocument: apiFunctions.getPlanDocument,
        savePlanDocument: apiFunctions.savePlanDocument,
        getTechSpecDocument: async () => { throw new Error("Not implemented for PlanDocumentModel"); },
        saveTechSpecDocument: async () => { throw new Error("Not implemented for PlanDocumentModel"); },
    });
  }

  public async getDocument(): Promise<string | null> {
    try {
      return await this.api.getPlanDocument(this.projectId);
    } catch (error) {
      console.error("Error fetching Plan document:", error);
      return null;
    }
  }

  public async saveDocument(content: string): Promise<void> {
    try {
      await this.api.savePlanDocument(this.projectId, content);
    } catch (error) {
      console.error("Error saving Plan document:", error);
      throw new Error(`Failed to save Project Plan: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Technical Specifications ドキュメント用モデル
 */
export class TechSpecDocumentModel extends DocumentModel {
    constructor(projectId: string, apiFunctions: Pick<ApiFunctions, 'getTechSpecDocument' | 'saveTechSpecDocument'>) {
        super(projectId, {
            getTechSpecDocument: apiFunctions.getTechSpecDocument,
            saveTechSpecDocument: apiFunctions.saveTechSpecDocument,
            getPlanDocument: async () => { throw new Error("Not implemented for TechSpecDocumentModel"); },
            savePlanDocument: async () => { throw new Error("Not implemented for TechSpecDocumentModel"); },
        });
    }

  public async getDocument(): Promise<string | null> {
    try {
      return await this.api.getTechSpecDocument(this.projectId);
    } catch (error) {
      console.error("Error fetching Tech Spec document:", error);
      return null;
    }
  }

  public async saveDocument(content: string): Promise<void> {
    try {
      await this.api.saveTechSpecDocument(this.projectId, content);
    } catch (error) {
      console.error("Error saving Tech Spec document:", error);
      throw new Error(`Failed to save Technical Specifications: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const defaultDocumentApiFunctions: DocumentApiFunctions = {
    getPlanDocument,
    getTechSpecDocument,
  savePlanDocument,
  saveTechSpecDocument
};

/**
 * Model for managing issues (tickets)
 */
export class IssueModel {
  protected projectId: string;
  protected api: IssueModelApiFunctions;

  constructor(projectId: string, apiFunctions: IssueModelApiFunctions) {
    if (!projectId) {
      throw new Error("Project ID is required.");
    }
    this.projectId = projectId;
    this.api = apiFunctions;
  }

  /**
   * Fetches the list of issues for the project.
   * @returns A promise that resolves to an array of Tickets or null if an error occurs.
   */
  public async getIssuesList(): Promise<Ticket[] | null> {
    try {
      const issues = await this.api.getIssues(this.projectId);
      return issues ?? [];
    } catch (error) {
      console.error(`Error fetching issues for project ${this.projectId}:`, error);
      return null;
    }
  }

  /**
   * Saves the list of issues for the project.
   * @param issues The array of Tickets to save.
   */
  public async saveIssuesList(issues: Ticket[]): Promise<void> {
    try {
      // Process each issue individually
      for (const issue of issues) {
        await this.api.saveIssues(this.projectId, issue);
      }
    } catch (error) {
      console.error(`Error saving issues for project ${this.projectId}:`, error);
      throw error;
    }
  }

}
