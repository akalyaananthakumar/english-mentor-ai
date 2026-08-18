const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const sendButton = document.getElementById("sendButton");
const welcome = document.getElementById("welcome");

// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage() {

    const message = messageInput.value.trim();

    if (!message) {
        return;
    }

    // Hide welcome screen
    if (welcome) {
        welcome.style.display = "none";
    }

    // Add user message
    addUserMessage(message);

    // Clear input
    messageInput.value = "";

    autoResize();

    // Disable send button
    sendButton.disabled = true;

    // Show typing indicator
    const typingElement = addTyping();

    try {

        const response = await fetch("/chat", {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify({
                message: message
            })
        });

        // ----------------------------------------------------
        // CHECK HTTP RESPONSE
        // ----------------------------------------------------

        if (!response.ok) {

            let errorMessage = "Server error.";

            try {
                const errorData = await response.json();

                if (errorData.error) {
                    errorMessage = errorData.error;
                }

            } catch (error) {
                console.error("Could not read server error:", error);
            }

            throw new Error(errorMessage);
        }

        // ----------------------------------------------------
        // READ COMPLETE JSON RESPONSE
        // ----------------------------------------------------

        const data = await response.json();

        console.log("Complete server response:", data);

        // Remove typing indicator
        if (typingElement) {
            typingElement.remove();
        }

        // ----------------------------------------------------
        // CHECK BACKEND SUCCESS
        // ----------------------------------------------------

        if (!data.success) {

            addAIMessage(
                data.error ||
                "Sorry, I couldn't generate a response."
            );

            return;
        }

        // ----------------------------------------------------
        // GET COMPLETE AI RESPONSE
        // ----------------------------------------------------

        const aiResponse = data.reply;

        console.log(
            "AI response length:",
            aiResponse ? aiResponse.length : 0
        );

        console.log(
            "AI response:",
            aiResponse
        );

        // ----------------------------------------------------
        // CHECK EMPTY RESPONSE
        // ----------------------------------------------------

        if (
            typeof aiResponse !== "string" ||
            aiResponse.trim() === ""
        ) {

            addAIMessage(
                "Sorry, I received an empty response. Please try again."
            );

            return;
        }

        // ----------------------------------------------------
        // DISPLAY COMPLETE RESPONSE
        // ----------------------------------------------------

        addAIMessage(aiResponse);

    } catch (error) {

        console.error("Chat error:", error);

        if (typingElement) {
            typingElement.remove();
        }

        addAIMessage(
            "⚠️ " +
            (error.message ||
            "Sorry, something went wrong. Please try again.")
        );

    } finally {

        sendButton.disabled = false;

        messageInput.focus();
    }
}


// ============================================================
// USER MESSAGE
// ============================================================

function addUserMessage(text) {

    const message = document.createElement("div");

    message.className = "message user-message";

    message.innerHTML = `
        <div class="message-content">

            <div class="message-name">
                You
            </div>

            <div class="bubble">
                ${escapeHTML(text)}
            </div>

        </div>

        <div class="avatar user-avatar">
            👤
        </div>
    `;

    messages.appendChild(message);

    scrollToBottom();
}


// ============================================================
// AI MESSAGE
// ============================================================

function addAIMessage(text) {

    const message = document.createElement("div");

    message.className = "message ai-message";

    message.innerHTML = `
        <div class="avatar ai-avatar">
            ✨
        </div>

        <div class="message-content">

            <div class="message-name">
                English Mentor AI
            </div>

            <div class="bubble ai-response">
                ${formatAIResponse(text)}
            </div>

        </div>
    `;

    messages.appendChild(message);

    scrollToBottom();
}


// ============================================================
// AI RESPONSE FORMATTER
// ============================================================

function formatAIResponse(text) {

    if (text === null || text === undefined) {
        return "";
    }

    // Convert everything to string
    text = String(text);

    // IMPORTANT:
    // Escape HTML FIRST for security
    let formatted = escapeHTML(text);

    // --------------------------------------------------------
    // Markdown bold
    // --------------------------------------------------------

    formatted = formatted.replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>"
    );

    // --------------------------------------------------------
    // Markdown headings
    // --------------------------------------------------------

    formatted = formatted.replace(
        /^### (.+)$/gm,
        "<strong>$1</strong>"
    );

    formatted = formatted.replace(
        /^## (.+)$/gm,
        "<strong>$1</strong>"
    );

    formatted = formatted.replace(
        /^# (.+)$/gm,
        "<strong>$1</strong>"
    );

    // --------------------------------------------------------
    // Markdown bullet points
    // --------------------------------------------------------

    formatted = formatted.replace(
        /^[-*] (.+)$/gm,
        "• $1"
    );

    // --------------------------------------------------------
    // Preserve line breaks
    // --------------------------------------------------------

    formatted = formatted.replace(/\r\n/g, "\n");

    formatted = formatted.replace(
        /\n/g,
        "<br>"
    );

    return formatted;
}


// ============================================================
// TYPING INDICATOR
// ============================================================

function addTyping() {

    const message = document.createElement("div");

    message.className = "message ai-message";

    message.innerHTML = `
        <div class="avatar ai-avatar">
            ✨
        </div>

        <div class="message-content">

            <div class="message-name">
                English Mentor AI
            </div>

            <div class="bubble">

                <div class="typing">

                    <span></span>
                    <span></span>
                    <span></span>

                </div>

            </div>

        </div>
    `;

    messages.appendChild(message);

    scrollToBottom();

    return message;
}


// ============================================================
// QUICK MESSAGE
// ============================================================

function quickMessage(text) {

    messageInput.value = text;

    autoResize();

    messageInput.focus();

    sendMessage();
}


// ============================================================
// CLEAR CHAT
// ============================================================

function clearChat() {

    messages.innerHTML = `
        <div class="message ai-message">

            <div class="avatar ai-avatar">
                ✨
            </div>

            <div class="message-content">

                <div class="message-name">
                    English Mentor AI
                </div>

                <div class="bubble">

                    <p>
                        👋 Welcome back!
                    </p>

                    <p>
                        What would you like to practice today?
                    </p>

                    <ul>
                        <li>Grammar</li>
                        <li>Vocabulary</li>
                        <li>Conversation</li>
                        <li>Practice</li>
                    </ul>

                </div>

            </div>

        </div>
    `;

    if (welcome) {
        welcome.style.display = "block";
    }

    messageInput.value = "";

    autoResize();

    messageInput.focus();
}


// ============================================================
// DARK MODE
// ============================================================

function toggleTheme() {

    document.body.classList.toggle("dark");

    const dark =
        document.body.classList.contains("dark");

    localStorage.setItem(
        "englishMentorTheme",
        dark ? "dark" : "light"
    );
}


// ============================================================
// LOAD SAVED THEME
// ============================================================

if (
    localStorage.getItem("englishMentorTheme") === "dark"
) {
    document.body.classList.add("dark");
}


// ============================================================
// ENTER TO SEND
// ============================================================

function handleKeyDown(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();
    }
}


// ============================================================
// AUTO RESIZE TEXTAREA
// ============================================================

if (messageInput) {

    messageInput.addEventListener(
        "input",
        autoResize
    );
}


function autoResize() {

    if (!messageInput) {
        return;
    }

    messageInput.style.height = "auto";

    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            130
        ) + "px";
}


// ============================================================
// SCROLL
// ============================================================

function scrollToBottom() {

    const chatArea =
        document.getElementById("chatArea");

    if (!chatArea) {
        return;
    }

    setTimeout(() => {

        chatArea.scrollTop =
            chatArea.scrollHeight;

    }, 50);
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = String(text);

    return div.innerHTML;
}
