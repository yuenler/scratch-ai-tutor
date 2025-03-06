// UI-related functions and components for Scratch AI Tutor

// Create a namespace for our UI functions
window.ScratchAITutor = window.ScratchAITutor || {};
window.ScratchAITutor.UI = window.ScratchAITutor.UI || {};

/**
 * Create the UI components for the Scratch AI Tutor
 * @returns {Object} Object containing the shadow DOM and UI elements
 */
window.ScratchAITutor.UI.createUI = function() {
  // Create container and attach a shadow DOM
  const container = document.createElement("div");
  container.id = "scratch-ai-tutor-container";
  const shadow = container.attachShadow({ mode: "open" });

  // Load scratchblocks library if not already loaded
  if (typeof window.scratchblocks === 'undefined') {
    console.log("Loading scratchblocks library...");
    const script = document.createElement('script');
    script.src = 'https://scratchblocks.github.io/js/scratchblocks-v3.6-min.js';
    document.head.appendChild(script);
    
    script.onload = function() {
      console.log("Scratchblocks library loaded successfully");
    };
    
    script.onerror = function() {
      console.error("Failed to load scratchblocks library");
    };
  }

  // Add styles to shadow DOM
  const style = document.createElement("style");
  style.textContent = `
    * {
      box-sizing: border-box;
      -webkit-user-select: auto;
      -moz-user-select: auto;
      -ms-user-select: auto;
      user-select: auto;
    }
    
    #scratch-ai-tutor-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      max-height: 600px;
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      z-index: 9999;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      border: 1px solid #ddd;
      overflow: hidden;
    }
    
    #panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      background-color: #4c97ff;
      color: white;
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;
    }
    
    #panel-title {
      font-size: 16px;
      font-weight: bold;
      margin: 0;
    }
    
    .close-button {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
    }
    
    .close-button:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
    
    #systemMessage {
      padding: 10px 15px;
      background-color: #f7f7f7;
      border-bottom: 1px solid #ddd;
      font-size: 14px;
      color: #666;
    }
    
    #chatBody {
      flex: 1;
      overflow-y: auto;
      padding: 10px 15px;
      max-height: 350px;
    }
    
    .message {
      margin-bottom: 15px;
      display: flex;
      flex-direction: column;
    }
    
    .message-header {
      font-size: 12px;
      color: #888;
      margin-bottom: 5px;
    }
    
    .message-content {
      padding: 10px;
      border-radius: 8px;
      max-width: 100%;
      word-wrap: break-word;
    }
    
    .user-message .message-content {
      background-color: #e6f2ff;
      align-self: flex-end;
    }
    
    .assistant-message .message-content {
      background-color: #f1f1f1;
      align-self: flex-start;
    }
    
    /* Styles for scratchblocks */
    pre.blocks {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 10px;
      margin: 10px 0;
      overflow-x: auto;
      white-space: pre-wrap;
    }
    
    pre.blocks svg {
      max-width: 100%;
      height: auto;
    }
    
    pre.render-error {
      background-color: #fff0f0;
      border-left: 3px solid #ff6b6b;
      padding: 10px;
      font-family: monospace;
    }
    
    .thinking-indicator {
      display: flex;
      align-items: center;
      padding: 10px;
      color: #888;
    }
    
    .thinking-dots {
      display: flex;
      margin-left: 5px;
    }
    
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #888;
      margin: 0 2px;
      animation: pulse 1.5s infinite;
    }
    
    .dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .dot:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    @keyframes pulse {
      0%, 100% {
        opacity: 0.4;
      }
      50% {
        opacity: 1;
      }
    }
    
    #inputContainer {
      display: flex;
      padding: 10px;
      border-top: 1px solid #ddd;
    }
    
    #userInput {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 18px;
      padding: 8px 15px;
      font-size: 14px;
      resize: none;
      outline: none;
      max-height: 100px;
      overflow-y: auto;
    }
    
    #userInput:focus {
      border-color: #4c97ff;
    }
    
    #sendButton {
      background-color: #4c97ff;
      color: white;
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      margin-left: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    #sendButton:hover {
      background-color: #3373cc;
    }
    
    #minimizedButton {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background-color: #4c97ff;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9999;
    }
    
    #minimizedButton:hover {
      background-color: #3373cc;
    }
    
    .minimized-icon {
      color: white;
      font-size: 24px;
    }
    
    .minimized-close {
      position: absolute;
      top: -5px;
      right: -5px;
      background-color: #ff6680;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    
    .message-content p {
      margin: 0 0 10px 0;
    }
    
    .message-content p:last-child {
      margin-bottom: 0;
    }
    
    .message-content h1, .message-content h2, .message-content h3 {
      margin-top: 15px;
      margin-bottom: 10px;
    }
    
    .message-content ul, .message-content ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    
    .message-content li {
      margin-bottom: 5px;
    }
    
    .message-content pre {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
      margin: 10px 0;
    }
    
    .message-content code {
      background: #f0f0f0;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: monospace;
    }
    
    .message-content a {
      color: #4c97ff;
      text-decoration: none;
    }
    
    .message-content a:hover {
      text-decoration: underline;
    }
  `;
  shadow.appendChild(style);

  // Create the panel HTML structure
  const panel = document.createElement("div");
  panel.id = "scratch-ai-tutor-panel";
  panel.innerHTML = `
    <div id="panel-header">
      <h2 id="panel-title">Scratch AI Tutor</h2>
      <button class="close-button">×</button>
    </div>
    <div id="systemMessage">
      Hi! I'm your Scratch AI Tutor. Ask me anything about your Scratch project!
    </div>
    <div id="chatBody"></div>
    <div id="inputContainer">
      <textarea id="userInput" placeholder="Ask a question..." rows="1"></textarea>
      <button id="sendButton">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="white"/>
        </svg>
      </button>
    </div>
  `;
  shadow.appendChild(panel);

  // Create minimized button
  const minimizedButton = document.createElement("div");
  minimizedButton.id = "minimizedButton";
  minimizedButton.innerHTML = `
    <div class="minimized-icon">?</div>
    <div class="minimized-close">×</div>
  `;
  shadow.appendChild(minimizedButton);

  // Get elements from shadow DOM
  const systemMessageEl = shadow.getElementById("systemMessage");
  const chatBody = shadow.getElementById("chatBody");
  const userInput = shadow.getElementById("userInput");
  const sendButton = shadow.getElementById("sendButton");
  const closeButton = shadow.querySelector(".close-button");

  // Return the created UI elements
  return {
    container,
    shadow,
    panel,
    minimizedButton,
    systemMessageEl,
    chatBody,
    userInput,
    sendButton,
    closeButton
  };
};

/**
 * Add a message to the chat
 * @param {HTMLElement} chatBody - The chat body element
 * @param {ShadowRoot} shadow - The shadow DOM root
 * @param {string} content - The message content
 * @param {string} type - The message type (user or assistant)
 */
window.ScratchAITutor.UI.addMessage = function(chatBody, shadow, content, type) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}-message`;
  
  const messageHeader = document.createElement("div");
  messageHeader.className = "message-header";
  messageHeader.textContent = type === "user" ? "You" : "Scratch AI Tutor";
  
  const messageContent = document.createElement("div");
  messageContent.className = "message-content";
  
  // Parse markdown for assistant messages
  if (type === "assistant") {
    // Check if content contains scratchblocks code
    const hasScratchblocks = content.includes("```scratchblocks");
    
    // Parse markdown
    messageContent.innerHTML = window.ScratchAITutor.Markdown.parseMarkdown(content);
    
    // Add the message to the chat first
    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(messageContent);
    chatBody.appendChild(messageDiv);
    
    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // If there are scratchblocks, render them with a slight delay to ensure DOM is updated
    if (hasScratchblocks) {
      console.log("Content contains scratchblocks, rendering...");
      setTimeout(() => {
        window.ScratchAITutor.ScratchBlocks.renderScratchblocks(shadow);
      }, 100);
    }
  } else {
    messageContent.textContent = content;
    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(messageContent);
    chatBody.appendChild(messageDiv);
    
    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight;
  }
};

/**
 * Show thinking indicator
 * @param {HTMLElement} chatBody - The chat body element
 * @returns {HTMLElement} The thinking indicator element
 */
window.ScratchAITutor.UI.showThinkingIndicator = function(chatBody) {
  const thinkingDiv = document.createElement("div");
  thinkingDiv.className = "thinking-indicator";
  thinkingDiv.innerHTML = `
    Thinking<div class="thinking-dots">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div>
  `;
  chatBody.appendChild(thinkingDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
  return thinkingDiv;
};

/**
 * Hide the panel
 * @param {HTMLElement} panel - The panel element
 * @param {HTMLElement} minimizedButton - The minimized button element
 */
window.ScratchAITutor.UI.hidePanel = function(panel, minimizedButton) {
  panel.style.display = "none";
  minimizedButton.style.display = "block";
};

/**
 * Show the panel
 * @param {HTMLElement} panel - The panel element
 * @param {HTMLElement} minimizedButton - The minimized button element
 */
window.ScratchAITutor.UI.showPanel = function(panel, minimizedButton) {
  panel.style.display = "flex";
  minimizedButton.style.display = "none";
};
