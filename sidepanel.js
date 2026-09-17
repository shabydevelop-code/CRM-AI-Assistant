import { AIService } from "./ai/ai-service.js";

const sendButton = document.getElementById("send");
const promptInput = document.getElementById("prompt");
const chat = document.getElementById("chat");

const aiService = new AIService();

function formatTimestamp(date = new Date()) {
    return new Intl.DateTimeFormat("he-IL", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).format(date);
}

function addMessage(text, type, timestamp = null) {
    const message = document.createElement("div");
    message.classList.add("message", type);
    message.dir = "rtl";

    const time = document.createElement("div");
    time.classList.add("message-time");
    message.appendChild(time);

    if (timestamp) {
        time.textContent = formatTimestamp(timestamp);
    }

    const content = document.createElement("div");
    content.classList.add("message-content");
    content.textContent = text;
    message.appendChild(content);

    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;

    return {
        element: message,
        content,
        time
    };
}

async function sendMessage() {
    const prompt = promptInput.value.trim();

    if (!prompt) {
        return;
    }

    addMessage(prompt, "user", new Date());
    promptInput.value = "";
    promptInput.focus();
    sendButton.disabled = true;

    // The AI timestamp is intentionally left empty while waiting.
    // It is set when the first response chunk actually arrives.
    const aiMessage = addMessage("חושב...", "ai");
    let receivedFirstChunk = false;

    try {
        for await (const chunk of aiService.promptStreaming(prompt)) {
            if (!receivedFirstChunk) {
                aiMessage.content.textContent = "";
                aiMessage.time.textContent = formatTimestamp(new Date());
                receivedFirstChunk = true;
            }

            aiMessage.content.textContent += chunk;
            chat.scrollTop = chat.scrollHeight;
        }

        if (!receivedFirstChunk || !aiMessage.content.textContent.trim()) {
            aiMessage.content.textContent = "לא התקבלה תשובה מה-AI.";

            if (!aiMessage.time.textContent) {
                aiMessage.time.textContent = formatTimestamp(new Date());
            }
        }
    } catch (error) {
        console.error("AI error:", error);
        aiMessage.content.textContent =
            `אירעה שגיאה בהפעלת ה-AI: ${error.message || String(error)}`;

        if (!aiMessage.time.textContent) {
            aiMessage.time.textContent = formatTimestamp(new Date());
        }
    } finally {
        sendButton.disabled = false;
        promptInput.focus();
    }
}

sendButton.addEventListener("click", sendMessage);

promptInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

window.addEventListener("unload", () => {
    aiService.destroy();
});
