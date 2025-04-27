// Define the callback type for streaming updates
type StreamCallback = (chunk: string) => void;
type ErrorCallback = (error: any) => void;
type CloseCallback = () => void;

// Function to send a message and handle streaming response using fetch
export const sendStreamingMessage = (
  type: 'plan' | 'technicalSpecs',
  messageContent: string,
  onStreamUpdate: StreamCallback,
  onError: ErrorCallback,
  onClose: CloseCallback
): AbortController => { // 戻り値をAbortControllerに変更
  const url = type === 'plan'
    ? '/chat/plan/stream'
    : '/chat/tech-spec/stream';

  const controller = new AbortController(); // AbortControllerを作成
  const signal = controller.signal;

  const fetchData = async () => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add any necessary authentication headers here if required
        },
        body: JSON.stringify({ message: messageContent }),
        signal, // AbortSignalを渡す
      });

      if (!response.ok) {
        // レスポンスがエラーの場合、エラーメッセージを取得してエラーコールバックを呼ぶ
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = ''; // bufferをループの外で宣言

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break; // ストリームが終了したらループを抜ける
        }
        const chunk = decoder.decode(value, { stream: true });
        // サーバーからのSSE形式（data: ...\n\n）を想定してパース
        // 複数のメッセージが1つのチャンクに含まれる場合や、メッセージがチャンク間で分割される場合に対応
        // ループ内の宣言を削除
        buffer += chunk;
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const message = buffer.substring(0, boundary);
          buffer = buffer.substring(boundary + 2);
          if (message.startsWith('data: ')) {
            const data = message.substring(6).trim();
            if (data) {
              // [DONE]のような終了シグナルをチェックする場合
              // if (data === '[DONE]') {
              //   // 終了処理
              //   reader.cancel(); // ストリームの読み取りをキャンセル
              //   break; // ループを抜ける
              // }
              onStreamUpdate(data);
            }
          }
          boundary = buffer.indexOf('\n\n');
        }
        // メッセージの境界が見つからなかった場合、次のチャンクのためにバッファに残す
        // （ただし、最後のチャンクの後に\n\nがない場合を考慮する必要があるかもしれない）
      }
      // ストリーム終了後にバッファに残っているデータを処理（もしあれば）
      if (buffer.startsWith('data: ')) {
          const data = buffer.substring(6).trim();
          if (data) {
              onStreamUpdate(data);
          }
      }


    } catch (error: any) {
      // AbortErrorの場合はユーザーによるキャンセルなので、エラーとして扱わない場合もある
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        console.error('Fetch failed:', error);
        onError(error); // エラーコールバックを呼ぶ
      }
    } finally {
      onClose(); // 正常終了、エラー、キャンセルのいずれの場合もクローズコールバックを呼ぶ
    }
  };

  fetchData(); // 非同期処理を開始

  return controller; // AbortControllerを返す
};

// --- Potentially add other API functions below ---
// Example: Function to get project details (if needed)
// export const getProjectDetailsAPI = async (projectId: string): Promise<ProjectDetails | null> => {
//   try {
//     const response = await fetch(`/api/projects/${projectId}`); // Adjust URL as needed
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     return await response.json();
//   } catch (error) {
//     console.error("Failed to fetch project details:", error);
//     return null;
//   }
// };

// Example: Function to get conversation history (if needed)
// export const getConversationHistoryAPI = async (projectId: string, type: 'plan' | 'technicalSpecs'): Promise<Conversation | null> => {
//   try {
//     const response = await fetch(`/api/conversations/${projectId}/${type}`); // Adjust URL as needed
//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }
//     return await response.json();
//   } catch (error) {
//     console.error("Failed to fetch conversation history:", error);
//     return null;
//   }
// };
