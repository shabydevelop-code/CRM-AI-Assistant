const MODEL_OPTIONS = {
    expectedOutputs: [
        {
            type: "text",
            languages: ["en"]
        }
    ]
};

export class AIService {
    #session = null;
    #systemPrompt = null;

    async initialize() {
        if (this.#session) {
            return;
        }

        if (!("LanguageModel" in self)) {
            throw new Error("Chrome Built-in AI אינו זמין בדפדפן הזה.");
        }

        const availability = await LanguageModel.availability(MODEL_OPTIONS);
        console.log("LanguageModel availability:", availability);

        if (availability === "unavailable") {
            throw new Error("מודל ה-AI אינו זמין במחשב הזה.");
        }

        const systemPrompt = await this.#loadSystemPrompt();

        this.#session = await LanguageModel.create({
            ...MODEL_OPTIONS,
            initialPrompts: [
                {
                    role: "system",
                    content: systemPrompt
                }
            ],
            monitor(monitor) {
                monitor.addEventListener("downloadprogress", (event) => {
                    const percent = Math.round(event.loaded * 100);
                    console.log(`AI model download: ${percent}%`);
                });
            }
        });
    }

    async *promptStreaming(prompt) {
        await this.initialize();

        try {
            const stream = this.#session.promptStreaming(prompt);

            for await (const chunk of stream) {
                yield chunk;
            }
        } catch (error) {
            this.destroy();
            throw error;
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
        try {
            this.#session?.destroy();
        } catch (_) {
            // אין צורך בפעולה נוספת בזמן ניקוי session.
        }

        this.#session = null;
    }
}