# CodeCompile

A guided learning platform that helps learners develop computational thinking before writing code.

## Milestone 1

Static Next.js + TypeScript + Tailwind UI with a landing page and one guided sample problem session. No authentication, persistence, backend logic, OpenAI integration, or code execution is included yet.

## Run locally

```bash
npm install
npm run dev
```

## AI mentor setup

1. Copy `.env.local.example` to `.env.local`.
2. Set `OPENAI_API_KEY` in `.env.local` to your OpenAI API key. This file is ignored by Git and is only read on the server.
3. Open `http://localhost:3000/session`.

Enter a short explanation of the Two Sum problem and select **Share my thinking**. The mentor replies with a Socratic question. Continue responding to verify that the current browser-session conversation history is included in later requests. To test retry behavior, temporarily remove the key or disconnect the network, submit a response, then use **Retry** after restoring it.

