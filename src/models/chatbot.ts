import { Message, Ticket } from '../types'; // Added Ticket
import {
  sendStreamingMessage,
  sendIssueContentStreamingMessage,
  ApiFunctions
} from '../services/api';


type StreamCallback = (chunk: { message?: string; file?: string; issues?: Ticket[] }) => void; // Added issues to StreamCallback
type ErrorCallback = (error: Error) => void;
type CompletionCallback = () => void;

/**
 * チャットボットのメッセージ送信機能を提供する抽象クラス
 */
export abstract class Chatbot {
  protected projectId: string;
  protected api: Pick<ApiFunctions, 'sendStreamingMessage'>;

  constructor(projectId: string, apiFunctions: Pick<ApiFunctions, 'sendStreamingMessage'>) {
    if (!projectId) {
      throw new Error("Project ID is required.");
    }
    this.projectId = projectId;
    this.api = apiFunctions;
  }

  /**
   * AIアシスタントにメッセージを送信し、ストリーミングで応答を受け取る
   * @param type チャットの種類 ('plan' または 'technicalSpecs')
   * @param messageContent 送信するメッセージ内容
   * @param history これまでの会話履歴
   * @param onChunk チャンク受信時のコールバック
   * @param onError エラー発生時のコールバック
   * @param onComplete 完了時のコールバック
   * @returns AbortController インスタンス
   */
  public sendMessage(
    type: 'plan' | 'technicalSpecs' | 'issue', // Added 'issue' type
    messageContent: string,
    history: Array<{ [sender: string]: string }>,
    onChunk: StreamCallback,
    onError: ErrorCallback,
    onComplete: CompletionCallback
  ): AbortController {
    // sendStreamingMessage を直接呼び出す
    return this.api.sendStreamingMessage(
      type,
      messageContent,
      history,
      this.projectId,
      onChunk,
      onError,
      onComplete
    );
  }
}

/**
 * Project Plan 用チャットボット (メッセージ送信のみ)
 */
export class PlanChatbot extends Chatbot {
  constructor(projectId: string, apiFunctions: Pick<ApiFunctions, 'sendStreamingMessage'>) {
    super(projectId, apiFunctions);
  }
}

/**
 * Technical Specifications 用チャットボット (メッセージ送信のみ)
 */
export class TechSpecChatbot extends Chatbot {
  constructor(projectId: string, apiFunctions: Pick<ApiFunctions, 'sendStreamingMessage'>) {
    super(projectId, apiFunctions);
  }
}

/**
 * Issue 用チャットボット (メッセージ送信のみ)
 */
export class IssueChatbot extends Chatbot {
  private issueId: string | null = null;
  
  constructor(projectId: string, apiFunctions: Pick<ApiFunctions, 'sendStreamingMessage'>) {
    super(projectId, apiFunctions);
  }
  
  /**
   * Set the current issue ID for issue-specific chat
   * @param issueId The ID of the issue to chat about
   */
  public setIssueId(issueId: string): void {
    this.issueId = issueId;
  }
  
  /**
   * Send a message specifically about an issue's content
   * @param messageContent The message to send
   * @param history Previous conversation history
   * @param onChunk Callback for each chunk of streaming response
   * @param onError Callback for error handling
   * @param onComplete Callback when streaming is complete
   * @returns AbortController to cancel the request if needed
   */
  private isFromGitHub: boolean = false;

  /**
   * Set whether the current issue is from GitHub
   * @param isFromGitHub Whether the issue is from GitHub
   */
  public setIsFromGitHub(isFromGitHub: boolean): void {
    this.isFromGitHub = isFromGitHub;
  }

  public sendIssueContentMessage(
    messageContent: string,
    history: Array<{ [sender: string]: string }>,
    onChunk: StreamCallback,
    onError: ErrorCallback,
    onComplete: CompletionCallback
  ): AbortController {
    if (!this.issueId) {
      throw new Error("Issue ID must be set before sending issue content messages");
    }
    
    return sendIssueContentStreamingMessage(
      this.issueId,
      messageContent,
      history,
      this.projectId,
      onChunk,
      onError,
      onComplete,
      this.isFromGitHub
    );
  }
}

export const defaultChatbotApiFunctions: Pick<ApiFunctions, 'sendStreamingMessage'> = {
  sendStreamingMessage,
};
