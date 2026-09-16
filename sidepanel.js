import { AIService } from "./ai/ai-service.js";

const sendButton = document.getElementById("send");
const promptInput = document.getElementById("prompt");
const chat = document.getElementById("chat");

const aiService = new AIService();

function addMessage(text, type) {
    const message = document.createElement("div");
    message.classList.add("message", type);
    message.textContent = text;
    message.dir = "rtl";
    chat.appendChild(message);
    chat.scrollTop = chat.scrollHeight;
    return message;
}

async function sendMessage() {
    const prompt = promptInput.value.trim();

    if (!prompt) {
        return;
    }

    addMessage(prompt, "user");
    promptInput.value = "";
    promptInput.focus();
    sendButton.disabled = true;

    // Keep the loading message visible until Nano actually starts responding.
    const aiMessage = addMessage("חושב...", "ai");
    let receivedFirstChunk = false;

    try {
        for await (const chunk of aiService.promptStreaming(prompt)) {
            if (!receivedFirstChunk) {
                aiMessage.textContent = "";
                receivedFirstChunk = true;
            }

            aiMessage.textContent += chunk;
            chat.scrollTop = chat.scrollHeight;
        }

        if (!receivedFirstChunk || !aiMessage.textContent.trim()) {
            aiMessage.textContent = "לא התקבלה תשובה מה-AI.";
        }
    } catch (error) {
        console.error("AI error:", error);
        aiMessage.textContent =
            `אירעה שגיאה בהפעלת ה-AI: ${error.message || String(error)}`;
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