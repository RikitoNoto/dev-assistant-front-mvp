type StreamCallback = (data: { message?: string; file?: string }) => void;
type ErrorCallback = (error: any) => void;
type CloseCallback = () => void;

export const sendStreamingMessage = (
  type: 'plan' | 'technicalSpecs',
  messageContent: string,
  onStreamUpdate: StreamCallback,
  onError: ErrorCallback,
  onClose: CloseCallback
): AbortController => {
  const url = type === 'plan'
    ? '/chat/plan/stream'
    : '/chat/tech-spec/stream';

  const controller = new AbortController();
  const signal = controller.signal;

  const fetchData = async () => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageContent }),
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
        if (done) {
          // ストリーム終了時にバッファに残っているデータを処理
          if (buffer.trim()) {
            try {
              const jsonData = JSON.parse(buffer.trim());
              onStreamUpdate(jsonData);
            } catch (e) {
              console.error('Failed to parse final JSON chunk:', e, 'Chunk:', buffer.trim());
              // Consider calling onError if partial data is unacceptable
              // onError(`Failed to parse JSON: ${e}`);
            }
          }
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // 改行で区切られたJSONオブジェクトを処理
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const jsonString = buffer.substring(0, newlineIndex).trim();
          buffer = buffer.substring(newlineIndex + 1);

          if (jsonString) {
            try {
              const jsonData = JSON.parse(jsonString);
              onStreamUpdate(jsonData);
            } catch (e) {
              console.error('Failed to parse JSON chunk:', e, 'Chunk:', jsonString);
              // Consider calling onError if partial data is unacceptable
              // onError(`Failed to parse JSON: ${e}`);
            }
          }
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
