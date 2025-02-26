(function () {
  // Only show the extension if the URL includes "scratch.mit.edu/projects/"
  if (!window.location.href.includes("scratch.mit.edu/projects/")) {
    return;
  }

  // Store project tokens for reuse
  let projectTokens = {};

  // Load saved tokens from storage
  function loadProjectTokens() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(['scratchProjectTokens'], (result) => {
          if (chrome.runtime.lastError) {
            console.error('Error loading tokens:', chrome.runtime.lastError);
            resolve();
            return;
          }
          
          if (result && result.scratchProjectTokens) {
            try {
              projectTokens = JSON.parse(result.scratchProjectTokens);
              console.log('Loaded project tokens from storage:', Object.keys(projectTokens).length);
            } catch (e) {
              console.error('Error parsing stored tokens:', e);
              projectTokens = {};
            }
          } else {
            console.log('No saved project tokens found in storage');
          }
          resolve();
        });
      } catch (e) {
        console.error('Error accessing chrome storage:', e);
        resolve();
      }
    });
  }

  // Save tokens to storage
  function saveProjectTokens() {
    try {
      chrome.storage.local.set({
        'scratchProjectTokens': JSON.stringify(projectTokens)
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving tokens:', chrome.runtime.lastError);
        } else {
          console.log('Project tokens saved to storage');
        }
      });
    } catch (e) {
      console.error('Error saving to chrome storage:', e);
    }
  }

  // Extract project ID from URL
  function getProjectId(url) {
    const match = url.match(/scratch\.mit\.edu\/projects\/(\d+)/);
    return match ? match[1] : null;
  }

  // Create container and attach a shadow DOM
  const container = document.createElement("div");
  container.id = "scratch-ai-tutor-container";
  const shadow = container.attachShadow({ mode: "open" });

  // Load scratchblocks libraries into the main document
  function loadScratchblocksLibraries() {
    return new Promise((resolve) => {
      // Check if already loaded
      if (window.scratchblocks) {
        resolve();
        return;
      }

      // Load the main library
      const script1 = document.createElement("script");
      script1.src = chrome.runtime.getURL("lib/scratchblocks-min.js");
      
      // Load translations after main library is loaded
      script1.onload = () => {
        const script2 = document.createElement("script");
        script2.src = chrome.runtime.getURL("lib/translations-all.js");
        script2.onload = resolve;
        document.head.appendChild(script2);
      };
      
      document.head.appendChild(script1);
    });
  }

  // Load libraries
  loadScratchblocksLibraries();

  // Function to render scratchblocks in shadow DOM
  function renderScratchblocks() {
    if (!window.scratchblocks) return;
    
    const containers = shadow.querySelectorAll('.scratchblocks-container');
    containers.forEach(container => {
      if (!container.dataset.rendered) {
        try {
          const codeElement = container.querySelector('pre.blocks');
          if (codeElement) {
            // Get the text content
            const code = codeElement.textContent;
            
            // Render using scratchblocks
            const svg = window.scratchblocks.render(code, {
              style: 'scratch3',
              languages: ['en']
            });
            
            // Clear the container and append the SVG
            container.innerHTML = '';
            container.appendChild(svg);
            container.dataset.rendered = 'true';
          }
        } catch (e) {
          console.error('Error rendering scratchblocks:', e);
        }
      }
    });
  }

  // Check if scratchblocks is loaded periodically
  const scratchblocksCheckInterval = setInterval(() => {
    if (window.scratchblocks) {
      renderScratchblocks();
      clearInterval(scratchblocksCheckInterval);
    }
  }, 300);

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

    /* Scratch Blocks styling */
    .scratchblocks-container {
      margin: 10px 0;
      overflow-x: auto;
      background-color: #f7f7f7;
      border-radius: 8px;
      padding: 12px;
    }
    
    .scratchblocks-container svg {
      display: block;
      margin: 0 auto;
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
  minimizedButton.style.display = "flex";
  shadow.appendChild(minimizedButton);

  // Append the container to the real DOM
  document.body.appendChild(container);

  // Markdown parser
  function parseMarkdown(text) {
    // ScratchBlocks: triple backticks with scratchblocks language (multiple formats)
    const scratchblocksRegex = /```(scratchblocks|scratch|sb)\n([\s\S]+?)\n```/g;
    text = text.replace(scratchblocksRegex, function(match, langType, blockContent) {
      return `<div class="scratchblocks-container"><pre class="blocks">${blockContent}</pre></div>`;
    });
    
    // Regular code blocks: triple backticks
    text = text.replace(/```(?!(scratchblocks|scratch|sb))([\s\S]+?)```/g, function(match, p1, p2) {
      // p1 would be undefined if there's no language specified after the backticks
      // p2 contains the content within the code block
      const content = p2 || p1; // If p2 is undefined, use p1 as the content
      return `<pre style="background:#f0f0f0; padding:10px; border-radius:4px; overflow-x:auto;"><code>${content}</code></pre>`;
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
    const message = document.createElement("div");
    message.className = `message ${type}`;
    
    // Special handling for "thinking" state
    if (type === "bot thinking") {
      message.classList.add("thinking");
      message.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
    } else if (type === "bot") {
      // Parse markdown for bot messages
      message.innerHTML = parseMarkdown(content);
    } else {
      // User and system messages: no markdown parsing
      message.textContent = content;
    }
    
    chatBody.appendChild(message);
    chatBody.scrollTop = chatBody.scrollHeight;
    setTimeout(() => {
      renderScratchblocks();
    }, 50);
  }

  // Send question to server, with thinking indicator
  async function sendQuestion() {
    const projectId = getProjectId(window.location.href);
    const question = userInput.value.trim();
    
    if (!question) {
      return;
    }
    
    // Store cached token if we have one
    const cachedToken = projectTokens[projectId] || null;
    if (cachedToken) {
      console.log(`Using cached token for project ${projectId}`);
    }
    
    // Disable input while processing
    userInput.disabled = true;
    sendButton.disabled = true;
    
    // Add the user's question to the chat
    addMessage(question, "user");
    
    // Show thinking message
    addMessage("", "bot thinking");
    
    // Clear the input field
    userInput.value = "";

    try {

      console.log('Scratch url:', window.location.href);
      console.log('Question:', question);
      console.log('Cached token:', cachedToken);
      // Send the request to the server
      const response = await fetch('https://scratch-ai-tutor.vercel.app/api/scratch-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: window.location.href,
          question: question,
          projectToken: cachedToken // Send the cached token if available
        }),
      });

      console.log(response);
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }
      const data = await response.json();
      
      // Store the token for future use if provided
      if (data.projectToken && projectId) {
        projectTokens[projectId] = data.projectToken;
        console.log(`Stored token for project ${projectId}`);
        // Save to storage
        saveProjectTokens();
      }

      console.log(data.answer)
      
      // Remove thinking message
      const thinkingMessage = chatBody.querySelector('.message.bot.thinking');
      thinkingMessage.remove();
      addMessage(data.answer, "bot");
    } catch (error) {
      // Remove thinking message
      const thinkingMessage = chatBody.querySelector('.message.bot.thinking');
      thinkingMessage.remove();
      addMessage("Error: " + error.message, "bot");
    } finally {
      // Re-enable input
      userInput.disabled = false;
      sendButton.disabled = false;
    }
  }

  // Send button click
  sendButton.addEventListener("click", sendQuestion);

  // Allow sending via Enter while permitting Shift+Enter for new lines
  userInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
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

  // Load project tokens from storage and then initialize the UI
  loadProjectTokens().then(() => {
    console.log('Token loading complete, initializing UI');
    
    // Now check if we have an existing token for the current project
    const currentProjectId = getProjectId(window.location.href);
    if (currentProjectId && projectTokens[currentProjectId]) {
      console.log(`Found existing token for project ${currentProjectId}`);
    }
    
    // Show the panel
    panel.style.display = "flex";
    // Hide the minimized button
    minimizedButton.style.display = "none";
  });
})();
