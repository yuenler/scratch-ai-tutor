(function () {
  // Only show the extension if the URL includes "scratch.mit.edu/projects/"
  if (!window.location.href.includes("scratch.mit.edu/projects/")) {
    return;
  }

  // Create container and attach a shadow DOM
  const container = document.createElement("div");
  container.id = "scratch-ai-tutor-container";
  const shadow = container.attachShadow({ mode: "open" });

  // Create and append style element with updated styles
  const style = document.createElement("style");
  style.textContent = `
    * {
      box-sizing: border-box;
      -webkit-user-select: auto;
      -moz-user-select: auto;
      -ms-user-select: auto;
      user-select: auto;
    }

    .chat-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 500px;
      height: 600px;
      background-color: #ffffff;
      border: 1px solid #ccc;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.3s ease;
      z-index: 999999;
    }

    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #1976d2;
      color: white;
      padding: 12px 16px;
      cursor: move; /* for dragging */
      user-select: none; /* only header is non-selectable to enable drag */
    }

    .chat-header .header-title {
      flex: 1;
      font-size: 20px;
      font-weight: bold;
    }

    .chat-header .header-controls {
      display: flex;
      gap: 8px;
    }

    .chat-header .header-controls button {
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 18px;
      padding: 0 6px;
    }

    .chat-body {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      background: #f5f5f5;
      color: #333;

      /* Allows aligning messages left or right via align-self */
      display: flex;
      flex-direction: column;
    }

    .chat-input {
      display: flex;
      border-top: 1px solid #ccc;
      background: #fff;
    }

    .chat-input textarea {
      flex: 1;
      padding: 12px;
      border: none;
      outline: none;
      font-size: 16px;
      color: #333;
      resize: none;
      font-family: inherit;
      user-select: auto;
    }

    .chat-input button {
      padding: 12px 20px;
      background-color: #1976d2;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 16px;
    }

    .message {
      margin: 8px 0;
      padding: 10px 14px;
      border-radius: 20px; /* more curvature */
      display: inline-block; /* bubble shrinks to fit content */
      max-width: 70%;        /* up to 70% of container */
      word-wrap: break-word;
      white-space: pre-wrap;
    }

    /* Bot messages (left aligned) */
    .message.bot {
      background-color: #e2e3e5;
      color: #41464b;
      align-self: flex-start;
      text-align: left;
    }

    /* User messages (right aligned) */
    .message.user {
      background-color: #cce5ff;
      color: #004085;
      align-self: flex-end;
      text-align: left;
    }

    .message.system {
      background-color: #fff3cd;
      color: #664d03;
      align-self: center;
      font-style: italic;
      text-align: center;
      max-width: 80%;
    }

    /* Styles for bullet lists in markdown */
    .chat-body ul {
      margin: 0.5em 0;
      padding-left: 20px;
    }
    .chat-body li {
      margin-bottom: 0.3em;
    }

    /* Thinking animation styles */
    .message.bot.thinking {
      display: inline-flex;
      gap: 4px;
      align-items: center;
    }
    .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      background-color: #41464b;
      border-radius: 50%;
      opacity: 0.2;
      animation: blink 1.4s infinite both;
    }
    .dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    .dot:nth-child(3) {
      animation-delay: 0.4s;
    }
    @keyframes blink {
      0%, 80%, 100% { opacity: 0.2; }
      40% { opacity: 1; }
    }

    /* Minimized button styling (inside shadow DOM) */
    .scratch-ai-tutor-minimized-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99999999;
      padding: 12px 20px;
      background-color: #1976d2;
      color: #fff;
      border: 1px solid #ccc;
      border-radius: 8px;
      cursor: pointer;
      transition: transform 0.2s, background-color 0.2s;
      font-size: 16px;
      display: block; /* We'll start with it visible; panel hidden */
    }

    .scratch-ai-tutor-minimized-button:hover {
      transform: scale(1.05);
      background-color: #1565c0;
    }

    .scratch-ai-tutor-minimized-button .minimized-close {
      display: none;
      position: absolute;
      top: 2px;
      left: 2px;
      background-color: rgba(0,0,0,0.5);
      color: white;
      border-radius: 50%;
      width: 16px;
      height: 16px;
      font-size: 12px;
      text-align: center;
      line-height: 16px;
      cursor: pointer;
    }

    .scratch-ai-tutor-minimized-button:hover .minimized-close {
      display: block;
    }
  `;
  shadow.appendChild(style);

  // Create the panel HTML structure
  const panel = document.createElement("div");
  panel.className = "chat-panel";
  panel.innerHTML = `
    <div class="chat-header">
      <span class="header-title">Scratch AI Tutor</span>
      <div class="header-controls">
        <button class="close-button" title="Minimize">×</button>
      </div>
    </div>
    <div class="chat-body" id="chatBody">
      <div class="message system" id="systemMessage">
        Welcome to Scratch AI Tutor! Ask your question about your project.
      </div>
    </div>
    <div class="chat-input">
      <textarea id="userInput" placeholder="Ask a question..." rows="2"></textarea>
      <button id="sendButton">Send</button>
    </div>
  `;
  // Panel starts hidden (so we see the minimized button by default)
  panel.style.display = "none";
  shadow.appendChild(panel);

  // Create the minimized button inside the shadow DOM
  const minimizedButton = document.createElement("button");
  minimizedButton.className = "scratch-ai-tutor-minimized-button";
  // Provide the text and inner close icon
  minimizedButton.innerHTML = `
    Scratch AI Tutor
    <span class="minimized-close" title="Close extension">×</span>
  `;
  shadow.appendChild(minimizedButton);

  // Append the container to the real DOM
  document.body.appendChild(container);

  // Markdown parser
  function parseMarkdown(text) {
    // Code blocks: triple backticks
    text = text.replace(/```([\s\S]+?)```/g, function(match, p1) {
      return `<pre style="background:#f0f0f0; padding:10px; border-radius:4px; overflow-x:auto;"><code>${p1}</code></pre>`;
    });
    // Inline code: single backticks
    text = text.replace(/`([^`]+)`/g, '<code style="background:#f0f0f0; padding:2px 4px; border-radius:4px;">$1</code>');
    // Headers
    text = text.replace(/^###### (.*)$/gm, '<h6>$1</h6>');
    text = text.replace(/^##### (.*)$/gm, '<h5>$1</h5>');
    text = text.replace(/^#### (.*)$/gm, '<h4>$1</h4>');
    text = text.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    text = text.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    text = text.replace(/^# (.*)$/gm, '<h1>$1</h1>');
    // Bold & italics
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Bullet lists
    const lines = text.split('\n');
    const processedLines = [];
    let inList = false;
    for (let line of lines) {
      if (/^\s*-\s+/.test(line)) {
        if (!inList) {
          inList = true;
          processedLines.push('<ul>');
        }
        processedLines.push('<li>' + line.replace(/^\s*-\s+/, '') + '</li>');
      } else {
        if (inList) {
          inList = false;
          processedLines.push('</ul>');
        }
        processedLines.push(line);
      }
    }
    if (inList) {
      processedLines.push('</ul>');
    }
    text = processedLines.join('\n');

    // Replace newlines with <br>
    text = text.replace(/\n/g, '<br>');
    return text;
  }

  // Get elements from shadow DOM
  const systemMessageEl = shadow.getElementById("systemMessage");
  const chatBody = shadow.getElementById("chatBody");
  const userInput = shadow.getElementById("userInput");
  const sendButton = shadow.getElementById("sendButton");

  // Helper to add a message
  function addMessage(content, type) {
    const msg = document.createElement("div");
    msg.className = "message " + type;
    if (type === "bot") {
      msg.innerHTML = parseMarkdown(content);
    } else {
      msg.textContent = content; // user/system: no markdown parse
    }
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Send question to server, with thinking indicator
  async function sendQuestion(question) {
    // Show thinking indicator
    const thinkingMessage = document.createElement("div");
    thinkingMessage.className = "message bot thinking";
    thinkingMessage.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatBody.appendChild(thinkingMessage);
    chatBody.scrollTop = chatBody.scrollHeight;

    const currentUrl = window.location.href;
    try {
      const response = await fetch("https://scratch-ai-tutor.vercel.app/api/scratch-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl, question: question })
      });
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      const data = await response.json();
      thinkingMessage.remove();
      addMessage(data.answer, "bot");
    } catch (error) {
      thinkingMessage.remove();
      addMessage("Error: " + error.message, "bot");
    }
  }

  // Send button click
  sendButton.addEventListener("click", () => {
    const question = userInput.value.trim();
    if (!question) return;
    addMessage(question, "user");
    userInput.value = "";
    sendQuestion(question);
  });

  // Allow sending via Enter while permitting Shift+Enter for new lines
  userInput.addEventListener("keydown", function (e) {
    // Only intercept Enter if shift is not pressed
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendButton.click();
    }
  });

  // Draggable functionality on the header
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  const header = shadow.querySelector(".chat-header");

  header.addEventListener("mousedown", (e) => {
    // If the user clicks on a button in the header, don't drag
    if (e.target.tagName.toLowerCase() === "button") return;
    isDragging = true;
    const rect = panel.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      panel.style.left = (e.clientX - dragOffsetX) + "px";
      panel.style.top = (e.clientY - dragOffsetY) + "px";
      // Reset bottom/right so we don't fight with "fixed" positioning
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  // MINIMIZE / CLOSE FUNCTIONALITY
  const closeButton = shadow.querySelector(".close-button");
  // Minimizes the panel (hide it, show minimized button)
  function hidePanel() {
    panel.style.display = "none";
    minimizedButton.style.display = "block";
  }
  closeButton.addEventListener("click", hidePanel);

  // Clicking the minimized button reopens the panel
  minimizedButton.addEventListener("click", () => {
    // Show the panel
    panel.style.display = "flex";
    // Hide the minimized button
    minimizedButton.style.display = "none";
  });

  // The small X inside the minimized button removes the entire extension
  const minimizedClose = minimizedButton.querySelector(".minimized-close");
  minimizedClose.addEventListener("click", (e) => {
    e.stopPropagation(); // Don’t reopen the panel
    container.remove();  // remove the entire extension from the DOM
  });
})();
