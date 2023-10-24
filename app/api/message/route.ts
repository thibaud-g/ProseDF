import { NextRequest } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { SendMessageValidator } from "@/lib/validators/send-message-validator";
import { db } from "@/db";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { pinecone } from "@/lib/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { openai } from "@/lib/openai";
import {OpenAIStream, StreamingTextResponse} from "ai";
export const POST = async (request: NextRequest) => {
  const body = await request.json();
  const { getUser } = getKindeServerSession();
  const user = getUser();
  const { id: userId } = user;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { fileId, message } = SendMessageValidator.parse(body);

  const file = await db.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
  });

  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  await db.message.create({
    data: {
      fileId,
      text: message,
      isUserMessage: true,
      userId, 
    },
  });

  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const pineconeIndex = pinecone.Index("prosedf").namespace(userId);

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
  });

  const results = await vectorStore.similaritySearch(message, 4);

  const previousMessages = await db.message.findMany({
    where: {
      fileId,
    },
    orderBy:{
        createdAt:"asc"
    },
    take: 6,
  });

  const formattedPrevMessages = previousMessages.map((msg) => ({
    role: msg.isUserMessage ? 'user' as const : 'assistant' as ConstantSourceOptions,
    content : msg.text
  }))

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature:0,
    stream:true,
    messages: [
        {
          role: 'system',
          content:
            'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
        },
        {
          role: 'user',
          content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
          
    \n----------------\n
    
    PREVIOUS CONVERSATION:
    ${formattedPrevMessages.map((message) => {
      if (message.role === 'user') return `User: ${message.content}\n`
      return `Assistant: ${message.content}\n`
    })}
    
    \n----------------\n
    
    CONTEXT:
    ${results.map((r) => r.pageContent).join('\n\n')}
    
    USER INPUT: ${message}`,
        },
      ],
  })

  const stream = OpenAIStream(response, {
    async onCompletion(completion){
        await db.message.create({
            data:{
                text: completion,
                fileId,
                userId,
                isUserMessage: false
            }
        })
    }
  })

  return new StreamingTextResponse(stream)

};
