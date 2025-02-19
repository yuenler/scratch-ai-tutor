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
      top: 50px;
      left: 50px;
      width: 320px;
      height: 400px;
      background-color: #f9f9f9;
      border: 1px solid #ccc;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      z-index: 999999;
    }
    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: #4CAF50;
      color: white;
      padding: 6px 8px;
      cursor: move;
      user-select: none;
    }
    .chat-header .header-title {
      flex: 1;
      font-size: 18px;
      font-weight: bold;
    }
    .chat-header .header-controls {
      display: flex;
      gap: 4px;
    }
    .chat-header .header-controls button {
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 16px;
      padding: 0 4px;
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
      color: black;
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

  // Create the panel HTML structure with draggable header and controls
  const panel = document.createElement("div");
  panel.className = "chat-panel";
  panel.innerHTML = `
    <div class="chat-header">
      <span class="header-title">Scratch AI Tutor</span>
      <div class="header-controls">
        <button class="minimize-button" title="Minimize">_</button>
        <button class="close-button" title="Close">X</button>
      </div>
    </div>
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

  // Create a minimized button element (appended to the document body)
  const minimizedButton = document.createElement("button");
  minimizedButton.id = "scratch-ai-tutor-minimized-button";
  minimizedButton.textContent = "Scratch AI Tutor";
  minimizedButton.style.position = "fixed";
  minimizedButton.style.bottom = "20px";
  minimizedButton.style.left = "20px";
  minimizedButton.style.zIndex = "999999";
  minimizedButton.style.padding = "8px 12px";
  minimizedButton.style.backgroundColor = "#4CAF50";
  minimizedButton.style.color = "#fff";
  minimizedButton.style.border = "none";
  minimizedButton.style.borderRadius = "4px";
  minimizedButton.style.cursor = "pointer";
  minimizedButton.style.display = "none";
  document.body.appendChild(minimizedButton);

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
    if (!isScratchDomain()) {
      addMessage(
        "Please navigate to a scratch.mit.edu page to ask questions about your project.",
        "system"
      );
      return;
    }

    const currentUrl = window.location.href;
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

  // --- DRAGGABLE FUNCTIONALITY ---
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  const header = shadow.querySelector('.chat-header');
  header.addEventListener('mousedown', (e) => {
    // Prevent drag if a control button is clicked
    if (e.target.tagName.toLowerCase() === 'button') return;
    isDragging = true;
    const rect = panel.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
  });
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      panel.style.left = (e.clientX - dragOffsetX) + 'px';
      panel.style.top = (e.clientY - dragOffsetY) + 'px';
      // Remove any right positioning to let the left/top values take effect
      panel.style.right = 'auto';
    }
  });
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // --- MINIMIZE / CLOSE FUNCTIONALITY ---
  const closeButton = shadow.querySelector('.close-button');
  const minimizeButton = shadow.querySelector('.minimize-button');

  function hidePanel() {
    panel.style.display = "none";
    minimizedButton.style.display = "block";
  }

  closeButton.addEventListener('click', hidePanel);
  minimizeButton.addEventListener('click', hidePanel);

  minimizedButton.addEventListener('click', () => {
    panel.style.display = "flex";
    minimizedButton.style.display = "none";
  });
  
})();
