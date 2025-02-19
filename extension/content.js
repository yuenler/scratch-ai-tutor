(function () {
  // Create container and attach a shadow DOM
  const container = document.createElement("div");
  container.id = "scratch-ai-tutor-container";
  // Reset inherited styles for our container
  container.style.all = "initial";
  const shadow = container.attachShadow({ mode: "open" });

  // Create and append style element (customize these styles as desired)
  const style = document.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; }
    .chat-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 320px;
      height: 100%;
      background-color: #f9f9f9;
      border-left: 1px solid #ccc;
      box-shadow: -2px 0 5px rgba(0,0,0,0.1);
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      z-index: 999999;
    }
    .chat-header {
      background-color: #4CAF50;
      color: white;
      padding: 12px;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
    }
    .chat-body {
      flex: 1;
      padding: 10px;
      overflow-y: auto;
      background: #fff;
    }
    .chat-input {
      display: flex;
      border-top: 1px solid #ccc;
    }
    .chat-input input {
      flex: 1;
      padding: 10px;
      border: none;
      outline: none;
      font-size: 14px;
      color:black;
      background-color: #fff;
    }
    .chat-input button {
      padding: 10px 15px;
      background-color: #4CAF50;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 14px;
    }
    .message {
      margin: 5px 0;
      padding: 8px 10px;
      border-radius: 5px;
      max-width: 90%;
      word-wrap: break-word;
    }
    .message.user {
      background-color: #dcf8c6;
      align-self: flex-end;
    }
    .message.bot {
      background-color: #eee;
      align-self: flex-start;
    }
    .message.system {
      background-color: #ffc;
      color: black;
      align-self: center;
      font-style: italic;
    }
  `;
  shadow.appendChild(style);

  // Create the panel HTML structure
  const panel = document.createElement("div");
  panel.className = "chat-panel";
  panel.innerHTML = `
    <div class="chat-header">Scratch AI Tutor</div>
    <div class="chat-body" id="chatBody">
      <div class="message system" id="systemMessage">Loading...</div>
    </div>
    <div class="chat-input">
      <input type="text" id="userInput" placeholder="Ask a question...">
      <button id="sendButton">Send</button>
    </div>
  `;
  shadow.appendChild(panel);

  // Append the container to the document body so it shows on every page
  document.body.appendChild(container);

  // Check if the current page is on scratch.mit.edu
  function isScratchDomain() {
    return window.location.hostname.includes("scratch.mit.edu");
  }

  // Get elements from within the shadow root
  const systemMessageEl = shadow.getElementById("systemMessage");
  const chatBody = shadow.getElementById("chatBody");
  const userInput = shadow.getElementById("userInput");
  const sendButton = shadow.getElementById("sendButton");

  // Set the initial system message
  if (!isScratchDomain()) {
    systemMessageEl.textContent =
      "Please navigate to a scratch.mit.edu page to use the AI Tutor.";
  } else {
    systemMessageEl.textContent =
      "Welcome to Scratch AI Tutor! Ask your question about your project.";
  }

  // Helper function to add a message to the chat
  function addMessage(content, type) {
    const msg = document.createElement("div");
    msg.className = "message " + type;
    msg.textContent = content;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Function to send the question to the server
  async function sendQuestion(question) {
    // Make sure we are on scratch.mit.edu
    if (!isScratchDomain()) {
      addMessage(
        "Please navigate to a scratch.mit.edu page to ask questions about your project.",
        "system"
      );
      return;
    }

    const currentUrl = window.location.href;
    // Show a temporary “thinking…” message
    addMessage("Thinking...", "bot");

    console.log("URL:", currentUrl);
    console.log("Question:", question);

    try {
      const response = await fetch("https://scratch-ai-tutor.vercel.app/api/scratch-ai", {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: currentUrl,
          question: question
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      // Assume your server returns { answer: "..." }
      addMessage(data.answer, "bot");
    } catch (error) {
      addMessage("Error: " + error.message, "bot");
    }
  }

  // Event handler for send button clicks
  sendButton.addEventListener("click", () => {
    const question = userInput.value.trim();
    if (!question) return;
    addMessage(question, "user");
    userInput.value = "";
    sendQuestion(question);
  });

  // Allow sending via the Enter key
  userInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendButton.click();
    }
  });

  function toggleSidebar() {
    const sidebar = document.getElementById('chatbot-sidebar');
    const scratch = document.getElementById('scratch-window');
    if (!sidebar || !scratch) {
      console.warn('Sidebar or Scratch window element not found');
      return;
    }
    // Toggle display based on computed style
    const isHidden = window.getComputedStyle(sidebar).display === 'none';
    if (isHidden) {
      // Show sidebar and adjust scratch window margin
      sidebar.style.display = 'block';
      // Ensure the sidebar has a width before adjusting scratch margin
      scratch.style.marginRight = sidebar.offsetWidth + 'px';
    } else {
      // Hide sidebar and reset scratch window margin
      sidebar.style.display = 'none';
      scratch.style.marginRight = '0px';
    }
  }

  document.addEventListener("DOMContentLoaded", function() {
    if (!document.getElementById('toggle-chatbot')) {
      const toggleButton = document.createElement('button');
      toggleButton.id = 'toggle-chatbot';
      toggleButton.innerText = 'Toggle Chatbot Sidebar';
      // Style the button visibly and fixed in the viewport
      toggleButton.style.position = 'fixed';
      toggleButton.style.top = '10px';
      toggleButton.style.right = '10px';
      toggleButton.style.zIndex = '99999';
      toggleButton.style.padding = '8px 12px';
      toggleButton.style.backgroundColor = '#007bff';
      toggleButton.style.color = '#fff';
      toggleButton.style.border = 'none';
      toggleButton.style.borderRadius = '4px';
      toggleButton.style.cursor = 'pointer';
      
      toggleButton.addEventListener('click', toggleSidebar);
      document.body.appendChild(toggleButton);
    }
  });
})();
