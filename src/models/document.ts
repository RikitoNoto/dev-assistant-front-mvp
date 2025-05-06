import {
  getPlanDocument,
  getTechSpecDocument,
  savePlanDocument,
  saveTechSpecDocument,
  ApiFunctions
} from '../services/api';

type DocumentApiFunctions = Pick<ApiFunctions, 'getPlanDocument' | 'getTechSpecDocument' | 'savePlanDocument' | 'saveTechSpecDocument'>;

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
