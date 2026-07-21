# CodeCompile

CodeCompile is a guided learning platform that helps learners develop computational thinking before writing code.

## Milestone 3: AI-driven learning progression

The Two Sum practice session now guides a learner through six stages:

1. Understand
2. Assumptions
3. Approach
4. Edge Cases
5. Complexity
6. Code

After every learner response, the mentor evaluates whether the learner has demonstrated enough understanding of the active stage. If the response is incomplete or incorrect, the learner remains on that stage and receives another Socratic question. A completed stage advances to the next one; the final Code stage remains active once completed.

The active stage and conversation are stored in browser session storage, so they survive a page refresh during the same browser session.

## Mentor API

`POST /api/mentor` uses the official OpenAI SDK and the Responses API with Structured Outputs. It accepts the active stage, the learner response, and conversation history, and returns:

```json
{
  "mentorReply": "A concise Socratic response",
  "currentStage": "Understand",
  "nextStage": "Assumptions",
  "stageCompleted": true,
  "confidenceScore": 88
}
```

Progression is enforced on the server: `nextStage` changes only when `stageCompleted` is `true`. The API validates the stage, validates the model response, and derives the next stage from the canonical stage order.

## Run locally

```bash
npm install
npm run dev
```

## AI mentor setup

1. Copy `.env.local.example` to `.env.local`.
2. Set `OPENAI_API_KEY` in `.env.local` to your OpenAI API key. This file is ignored by Git and is only read on the server.
3. Open `http://localhost:3000/session`.
4. Explain your reasoning and select **Share my thinking**. Follow the mentor's questions to progress through the stages.

## Verification

```bash
npx tsc --noEmit
npm run build
```
