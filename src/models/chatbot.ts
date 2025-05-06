import { Message } from '../types';
import {
  sendStreamingMessage,
  ApiFunctions
} from '../services/api';


type StreamCallback = (chunk: { message?: string; file?: string }) => void;
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
    type: 'plan' | 'technicalSpecs',
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

export const defaultChatbotApiFunctions: Pick<ApiFunctions, 'sendStreamingMessage'> = {
  sendStreamingMessage,
};
