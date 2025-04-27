type StreamCallback = (chunk: string) => void;
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
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          const message = buffer.substring(0, boundary);
          buffer = buffer.substring(boundary + 2);
          if (message.startsWith('data: ')) {
            const data = message.substring(6).trim();
            if (data) {
              onStreamUpdate(data);
            }
          }
          boundary = buffer.indexOf('\n\n');
        }
      }
      if (buffer.startsWith('data: ')) {
          const data = buffer.substring(6).trim();
          if (data) {
              onStreamUpdate(data);
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
