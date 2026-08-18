const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const sendButton = document.getElementById("sendButton");
const welcome = document.getElementById("welcome");


// -----------------------------
// SEND MESSAGE
// -----------------------------

async function sendMessage() {

    const message = messageInput.value.trim();

    if (!message) {
        return;
    }

    // Hide welcome screen
    welcome.style.display = "none";

    // Add user message
    addUserMessage(message);

    // Clear input
    messageInput.value = "";

    autoResize();

    // Disable button
    sendButton.disabled = true;

    // Show typing
    const typingElement = addTyping();

    try {

        const response = await fetch("/chat", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message
            })

        });


        if (!response.ok) {
            throw new Error("Server error");
        }


        const data = await response.json();

        // Remove typing
        typingElement.remove();


        // Get AI response
        const aiResponse =
            data.response ||
            data.reply ||
            data.message ||
            "Sorry, I couldn't generate a response.";


        addAIMessage(aiResponse);


    } catch (error) {

        typingElement.remove();

        addAIMessage(
            "⚠️ Sorry, something went wrong. Please try again."
        );

        console.error(error);

    } finally {

        sendButton.disabled = false;

        messageInput.focus();
    }
}


// -----------------------------
// USER MESSAGE
// -----------------------------

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


// -----------------------------
// AI MESSAGE
// -----------------------------

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

            <div class="bubble">
                ${formatAIResponse(text)}
            </div>

        </div>

    `;

    messages.appendChild(message);

    scrollToBottom();
}


// -----------------------------
// AI RESPONSE FORMATTER
// -----------------------------

function formatAIResponse(text) {

    let formatted = escapeHTML(text);

    // Bold
    formatted = formatted.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    // Headings
    formatted = formatted.replace(
        /^### (.*?)$/gm,
        "<strong>$1</strong>"
    );

    // Line breaks
    formatted = formatted.replace(
        /\n/g,
        "<br>"
    );

    // Bullet points
    formatted = formatted.replace(
        /• /g,
        "• "
    );

    return formatted;
}


// -----------------------------
// TYPING INDICATOR
// -----------------------------

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


// -----------------------------
// QUICK MESSAGE
// -----------------------------

function quickMessage(text) {

    messageInput.value = text;

    autoResize();

    messageInput.focus();

    sendMessage();
}


// -----------------------------
// CLEAR CHAT
// -----------------------------

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

    welcome.style.display = "block";

    messageInput.value = "";

    messageInput.focus();
}


// -----------------------------
// DARK MODE
// -----------------------------

function toggleTheme() {

    document.body.classList.toggle("dark");

    const dark =
        document.body.classList.contains("dark");

    localStorage.setItem(
        "englishMentorTheme",
        dark ? "dark" : "light"
    );
}


// Load saved theme

if (
    localStorage.getItem("englishMentorTheme")
    === "dark"
) {
    document.body.classList.add("dark");
}


// -----------------------------
// ENTER TO SEND
// -----------------------------

function handleKeyDown(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();
    }
}


// -----------------------------
// AUTO RESIZE TEXTAREA
// -----------------------------

messageInput.addEventListener(
    "input",
    autoResize
);


function autoResize() {

    messageInput.style.height = "auto";

    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            130
        ) + "px";
}


// -----------------------------
// SCROLL
// -----------------------------

function scrollToBottom() {

    const chatArea =
        document.getElementById("chatArea");

    setTimeout(() => {

        chatArea.scrollTop =
            chatArea.scrollHeight;

    }, 50);
}


// -----------------------------
// ESCAPE HTML
// -----------------------------

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}
