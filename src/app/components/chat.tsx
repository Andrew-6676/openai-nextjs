'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSseQuery } from '@/app/queries/sse-query';
import Image from 'next/image';
import { ConversationItem, DEFAULT_PROMPT, GenerationResult } from '@/common';

import styles from './chat.module.css';

/*
The task is to develop web chat gpt interface with additional visualization capabilities.

0. Application must be based on **nextjs** framework.
1. Use provided **base_url** and **key** to access the model. (Don't abuse the provided key, as its usage is monitored). See attachment #1 for model access.
2. Web application must use **SSE** transport to render model output stream as it's generated. Pay special attention in handling corner cases.
3. You should implement **social login**.
4. Web application should store history of your conversations (in local storage)
5. In case model output matches format (0&1 matrix in code block followed by single number) run given number of iterations of [Game of Life](https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life) taking matrix as a start state.
Then render finishing state as a picture and add to model reply. Heavy lifting must be offloaded into **Web Worker** and not affecting UI responsibility. See attachment #2 for prompt example.

Solution must be provided in form of **github** project and **link to a deployed instance**.
 */
export default function Chat() {
  const [inputValue, setInputValue] = useState<string>(DEFAULT_PROMPT);
  const [gameResultImage, setGameResultImage] = useState<string | null>(null);
  const [response, setResponse] = useState<string>('');
  const [gameMessage, setGameMessage] = useState<string | null>(null);
  const [waitingImage, setWaitingImage] = useState<boolean>(false);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);

  const { isSuccess, isPending, mutateAsync: sendPrompt } = useSseQuery();

  const workerRef = useRef<Worker>();
  // for multiple conversations, to be able to switch between them (not implemented)
  const active_conversation_key = 'key_1';

  useEffect(() => {
    const savedConversation = JSON.parse(localStorage.getItem(`conversation#${active_conversation_key}`) ?? '[]');
    setConversation(savedConversation);

    workerRef.current = new Worker(new URL('../workers/game-of-life.worker.ts', import.meta.url));
    workerRef.current.onerror = (error) => {
      setWaitingImage(false);
      setGameMessage('Image generation error');
    };
    workerRef.current.onmessage = (event: MessageEvent<GenerationResult>) => {
      console.debug(`WebWorker Response =>`, event.data);

      const imageData = event.data.image;
      setGameMessage(event.data.message ?? null);
      setWaitingImage(false);

      if (imageData) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
        setGameResultImage(canvas.toDataURL());
      } else {
        setGameResultImage(null);
      }
    };
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    let tmpConversation = conversation.concat({ role: 'user', content: inputValue });
    let fullResponse = '';

    setResponse('Waiting...');
    setGameResultImage(null);
    await sendPrompt(
      {
        conversation: tmpConversation,
        onMessage: (dataChunk) => {
          fullResponse += dataChunk;

          setResponse(fullResponse);
        },
        onError: (message) => {
          alert(message);
          setResponse(`Server error: ${message}`);
        },
      },
      {
        onSuccess: () => {
          tmpConversation = tmpConversation.concat({ role: 'assistant', content: fullResponse });
          setConversation(tmpConversation);
          localStorage.setItem(`conversation#${active_conversation_key}`, JSON.stringify(tmpConversation));
          setWaitingImage(true);
          workerRef.current?.postMessage(fullResponse);
        },
        onError: () => {},
      },
    );
  }, [inputValue, sendPrompt, conversation]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    },
    [inputValue, handleSubmit],
  );

  const handleClearConversation = useCallback(() => {
    localStorage.removeItem(`conversation#${active_conversation_key}`);
    setConversation([]);
  }, []);

  return (
    <div className={styles.wrapper}>
      <button className={styles.clearButton} onClick={handleClearConversation}>
        Delete conversation ({conversation.length})
      </button>
      <h1>Game of Life {isPending && '(animation of processing...)'} </h1>
      <div className={styles.assistant}>
        <pre className={styles.answer} id="response">
          {response}
        </pre>
        {isSuccess && gameMessage && <small style={{ color: '#bebebe' }}>DEBUG: {gameMessage}</small>}
        {waitingImage && 'Waiting for image...'}
        {isSuccess && gameResultImage && <img src={gameResultImage} alt="game of life result" />}
      </div>
      <div style={{ flex: 1 }}></div>
      <div className={styles.user}>
        <textarea
          cols={100}
          rows={7}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={handleSubmit} disabled={isPending}>
          Отправить
        </button>
      </div>
    </div>
  );
}
