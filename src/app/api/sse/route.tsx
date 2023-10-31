import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { NextResponse, NextRequest } from 'next/server';
import { ConversationItem } from '@/common';

const encoder = new TextEncoder();
const client = new OpenAIClient('https://ai-proxy.lab.epam.com', new AzureKeyCredential(`${process.env.OAI_KEY}`));

const oaiRequest = async (conversation: ConversationItem[], writer: WritableStreamDefaultWriter) => {
  const events = client.listChatCompletions('gpt-35-turbo', conversation);
  // [{ role: 'user', content: conversation }, { role: 'assistant', content: answer }, ....]

  let resp = '';
  let i = 0;
  for await (const event of events) {
    i++;
    let data = '';
    for (const choice of event.choices) {
      const delta = choice.delta?.content;
      if (delta !== undefined) {
        resp += delta;
        data += delta;
      }
    }
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}` + '\n\n'));
  }
  console.debug(`RES (${i}) = `, resp);
};

export async function POST(req: NextRequest) {
  const body: {
    conversation: ConversationItem[];
  } = await req.json();

  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();

  oaiRequest(body.conversation, writer)
    .then(() => {
      console.info('Done!');
      writer.close();
    })
    .catch((e) => {
      const message = 'Something went wrong!';
      console.error(message);
      writer.write(encoder.encode(`event: ${JSON.stringify({ error: e, message })}` + '\n\n'));
      writer.close();
    });

  return new NextResponse(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}