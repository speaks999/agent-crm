import { createOpenAI } from '@ai-sdk/openai';
import { wrapLanguageModel } from 'ai';
import { devToolsMiddleware } from '@ai-sdk/devtools';

const baseOpenAI = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const enableDevTools =
  process.env.AI_SDK_DEVTOOLS === '1' ||
  process.env.AI_SDK_DEVTOOLS === 'true' ||
  process.env.NODE_ENV === 'development';

export const openai = new Proxy(baseOpenAI, {
  apply(target, thisArg, argArray) {
    const model = Reflect.apply(
      target as unknown as (...args: Parameters<typeof baseOpenAI>) => ReturnType<typeof baseOpenAI>,
      thisArg,
      argArray as Parameters<typeof baseOpenAI>,
    );

    // Only wrap language models. `openai.embedding(...)` is accessed via property get,
    // so embeddings won't be wrapped by this middleware (DevTools focuses on LLM calls).
    if (!enableDevTools) return model;

    return wrapLanguageModel({
      model,
      middleware: devToolsMiddleware(),
    });
  },
  get(target, prop, receiver) {
    return Reflect.get(target, prop, receiver);
  },
}) as unknown as typeof baseOpenAI;
