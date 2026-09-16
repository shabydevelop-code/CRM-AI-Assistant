import { AI_CONFIG } from "./ai-config.js";

export class AIService {
    #systemPrompt = null;
    #abortController = null;

    async initialize() {
        await this.#loadSystemPrompt();
    }

    async *promptStreaming(prompt) {
        await this.initialize();
        this.destroy();
        this.#abortController = new AbortController();

        const endpoint = `${AI_CONFIG.baseUrl}${AI_CONFIG.chatCompletionsPath}`;

        let response;

        try {
            response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "system",
                            content: this.#systemPrompt
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    stream: true,
                    reasoning_effort: AI_CONFIG.reasoningEffort,
                    max_tokens: AI_CONFIG.maxTokens,
                    temperature: AI_CONFIG.temperature
                }),
                signal: this.#abortController.signal
            });
        } catch (error) {
            this.destroy();

            if (error?.name === "AbortError") {
                throw error;
            }

            throw new Error(
                "לא ניתן להתחבר לשרת ה-AI המקומי. ודא שהשרת פועל על 127.0.0.1:8080."
            );
        }

        if (!response.ok) {
            const details = await response.text().catch(() => "");
            this.destroy();
            throw new Error(
                `שרת ה-AI החזיר שגיאה ${response.status}${details ? `: ${details}` : ""}`
            );
        }

        if (!response.body) {
            this.destroy();
            throw new Error("שרת ה-AI לא החזיר stream תקין.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
            while (true) {
                const { value, done } = await reader.read();
                buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

                const lines = buffer.split(/\r?\n/);
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                    const trimmed = line.trim();

                    if (!trimmed.startsWith("data:")) {
                        continue;
                    }

                    const data = trimmed.slice(5).trim();

                    if (!data || data === "[DONE]") {
                        continue;
                    }

                    let event;

                    try {
                        event = JSON.parse(data);
                    } catch (_) {
                        continue;
                    }

                    const content = event?.choices?.[0]?.delta?.content;

                    if (typeof content === "string" && content.length > 0) {
                        yield content;
                    }
                }

                if (done) {
                    break;
                }
            }
        } finally {
            reader.releaseLock();
            this.#abortController = null;
        }
    }

    async #loadSystemPrompt() {
        if (this.#systemPrompt) {
            return this.#systemPrompt;
        }

        const promptUrl = chrome.runtime.getURL("ai/system-prompt.md");
        const response = await fetch(promptUrl);

        if (!response.ok) {
            throw new Error("לא ניתן לטעון את הגדרות ה-AI.");
        }

        this.#systemPrompt = (await response.text()).trim();
        return this.#systemPrompt;
    }

    destroy() {
        if (this.#abortController) {
            this.#abortController.abort();
            this.#abortController = null;
        }
    }
}
