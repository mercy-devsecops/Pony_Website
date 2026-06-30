document.addEventListener("DOMContentLoaded", () => {

    console.log("AI CHAT JS LOADED");

    // =========================
    // STATE CONTROL (IMPORTANT)
    // =========================
    let isRequestPending = false;
    const responseCache = {};

    // =========================
    // ELEMENTS
    // =========================
    const chatToggleBtn = document.getElementById('chat-toggle-btn');
    const chatBox = document.getElementById('chat-box');
    const closeChat = document.getElementById('close-chat');
    const sendBtn = document.getElementById('send-btn');
    const chatInput = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');

    const whatsappBtn = document.getElementById('whatsapp-widget-btn');

    console.log("chatToggleBtn:", chatToggleBtn);
    console.log("chatBox:", chatBox);
    console.log("closeChat:", closeChat);

    // =========================
    // OPEN / CLOSE CHAT
    // =========================
    if (chatToggleBtn && chatBox) {
        chatToggleBtn.addEventListener('click', () => {
            chatBox.style.display = 'flex';
            chatToggleBtn.style.display = 'none';
            if (whatsappBtn) whatsappBtn.style.display = 'none';
        });
    }

    if (closeChat && chatToggleBtn && chatBox) {
        closeChat.addEventListener('click', () => {
            chatBox.style.display = 'none';
            chatToggleBtn.style.display = 'block';
            if (whatsappBtn) whatsappBtn.style.display = 'flex';
        });
    }

    // =========================
    // SEND MESSAGE EVENTS
    // =========================
    if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', sendUserMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendUserMessage();
        });
    }

    // =========================
    // FILTER: useless messages (SAVE API COST)
    // =========================
    const uselessMessages = ["hi", "hello", "hey", "ok", "okay", "?", "??"];

    // =========================
    // MAIN FUNCTION
    // =========================
    async function sendUserMessage() {

        const messageText = chatInput.value.trim().toLowerCase();

        if (!messageText) return;

        // prevent spam clicks
        if (isRequestPending) return;

        // prevent long spam messages
        if (messageText.length < 2) return;

        if (messageText.length > 200) {
            alert("Message too long 🌸");
            return;
        }

        // handle useless messages locally (NO API CALL)
        if (uselessMessages.includes(messageText)) {
            messagesContainer.innerHTML += `
                <p style="background:#f0ede6;padding:10px;border-radius:10px;margin-bottom:10px;max-width:85%;">
                    Hello 🌸 How can I help you choose flowers today?
                </p>
            `;
            return;
        }

        // CACHE CHECK (save API cost)
        if (responseCache[messageText]) {
            messagesContainer.innerHTML += `
                <p style="background:#f0ede6;padding:10px;border-radius:10px;margin-bottom:10px;max-width:85%;">
                    ${responseCache[messageText]}
                </p>
            `;
            return;
        }

        isRequestPending = true;

        // show user message
        messagesContainer.innerHTML += `
            <p style="background:#e27d60;color:white;padding:10px;border-radius:10px;margin-bottom:10px;max-width:85%;margin-left:auto;">
                ${messageText}
            </p>
        `;

        chatInput.value = '';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.id = "ai-typing-indicator";
        typingIndicator.style.cssText =
            "background:#f0ede6;padding:12px 15px;border-radius:10px;margin-bottom:10px;max-width:85%;";

        typingIndicator.innerHTML = "🌸 Thinking...";
        messagesContainer.appendChild(typingIndicator);

        try {

            // small delay (prevents fast spam requests)
            await new Promise(r => setTimeout(r, 800));

            const response = await fetch(
                `/api/chat`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: messageText
                    })
                }
            );

            const data = await response.json();

            console.log("Status:", response.status);
            console.log("Response:", data);

            document.getElementById("ai-typing-indicator")?.remove();

            if (!response.ok) {
                throw new Error(data?.error?.message || "API Error");
            }

            const aiResponse =
                data?.candidates?.[0]?.content?.parts?.[0]?.text ||
                "Sorry, no response generated.";

            // save to cache
            responseCache[messageText] = aiResponse;

            messagesContainer.innerHTML += `
                <p style="background:#f0ede6;padding:10px;border-radius:10px;margin-bottom:10px;max-width:85%;">
                    ${aiResponse}
                </p>
            `;

        } catch (error) {

            console.error(error);

            document.getElementById("ai-typing-indicator")?.remove();

            messagesContainer.innerHTML += `
                <p style="background:#fee2e2;color:#991b1b;padding:10px;border-radius:10px;margin-bottom:10px;">
                    Error: ${error.message}
                </p>
            `;
        }

        isRequestPending = false;

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

});
