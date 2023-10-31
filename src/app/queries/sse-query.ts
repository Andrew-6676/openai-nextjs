import { QueryClient, useMutation } from '@tanstack/react-query';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { ConversationItem } from '@/common';

const API_URL = '/api/sse';

const sendPromptAPI = async (
  conversation: ConversationItem[],
  onMessage: (dataChunk: string) => void,
  onError: (message: string) => void,
) => {
  await fetchEventSource(`${API_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversation,
    }),
    onmessage(event) {
      if (event.event) {
        const e = JSON.parse(event.event);
        if (e.error) {
          console.error(e.error);
          onError(e.message);
        }
        return;
      }
      onMessage(JSON.parse(event.data));
    },
    onerror(e) {
      console.log(e);
      onError(e.message);
    },
    onclose() {
      console.debug('Complete!');
    },
  });
};

interface MutationInput {
  conversation: ConversationItem[];
  onMessage: (dataChunk: string) => void;
  onError: (dataChunk: string) => void;
}

export const useSseQuery = () => {
  const queryClient = new QueryClient();

  return useMutation(
    {
      mutationFn: async ({ conversation, onMessage, onError }: MutationInput) =>
        sendPromptAPI(conversation, onMessage, onError),
      retry: false,
      onSuccess: () => {
        console.debug('SUCCESS!!!');
      },
    },
    queryClient,
  );
};
