export interface GenerationResult {
  text: string;
  image?: ImageData;
  message?: string;
}

export interface ConversationItem {
  role: 'user' | 'assistant';
  content: string;
}

export const DEFAULT_PROMPT = `We are about to start playing Game of Life. Please generate random starting state and then iteration number.
The format is starting state must be 2 dimension array with 1 and 0 separated by comma in markdown code block, where 0 means dead cell and 1 represents life cell.
Array should have any number of columns between 20 and 100 and any number of rows between 20 and 100. Then comes single number number of iteration to generate between 1 and 100000.
Don't use any words.`;
