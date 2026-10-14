import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";
import { createResponsesCall } from "@/server/ai/responses";
import { buildSystemPrompt } from "@/lib/saathi-prompt";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("AI is not configured", { status: 500 });
        let body: { messages?: UIMessage[]; language?: string; profile?: string };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid request", { status: 400 });
        }
        if (!Array.isArray(body.messages)) return new Response("Invalid messages", { status: 400 });
        const messages = await convertToModelMessages(body.messages);
        const call = createResponsesCall(
          request,
          { baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, model: "openai/gpt-6-astra" },
          messages,
          buildSystemPrompt(String(body.language || "English"), String(body.profile || "")),
        );
        return call.response();
      },
    },
  },
});
