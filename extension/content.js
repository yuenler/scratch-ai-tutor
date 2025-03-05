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

  // We no longer need to dynamically inject scratchblocks libraries since they are loaded via content_scripts.
  // Therefore, the injectScratchblocksLibraries() function has been removed.

  // Helper function to escape HTML special characters
  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // Helper function to unescape HTML entities
  function unescapeHtml(text) {
    return text
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, "&");
  }

  // Function to render scratchblocks in shadow DOM using scratchblocks.render
  function renderScratchblocks() {
    console.log("Attempting to render scratchblocks...");
    // Add scratchblocks CSS directly to shadow DOM
    if (!shadow.querySelector('#scratchblocks-style')) {
      const style = document.createElement('style');
      style.id = 'scratchblocks-style';
      
      // Full CSS for Scratch blocks - copied from the scratchblocks library
      style.textContent = `
        .sb3-label {
          font: 500 12pt Helvetica Neue, Helvetica, sans-serif;
          word-spacing: +1pt;
        }
        
        .sb3-literal-number,
        .sb3-literal-string,
        .sb3-literal-number-dropdown,
        .sb3-literal-dropdown {
          word-spacing: 0;
        }
        
        .sb3-comment {
          fill: #ffffa5;
          stroke: #d0d1d2;
          stroke-width: 1;
        }
        .sb3-comment-line {
          fill: #ffff80;
        }
        .sb3-comment-label {
          font: 400 12pt Helvetica Neue, Helvetica, sans-serif;
          fill: #000;
          word-spacing: 0;
        }
        
        .sb3-diff {
          fill: none;
          stroke: #000;
        }
        
        /* Motion blocks */
        svg .sb3-motion {
          fill: #4c97ff;
          stroke: #3373cc;
        }
        svg .sb3-motion-alt {
          fill: #4280d7;
        }
        svg .sb3-motion-dark {
          fill: #3373cc;
        }
        
        /* Looks blocks */
        svg .sb3-looks {
          fill: #9966ff;
          stroke: #774dcb;
        }
        svg .sb3-looks-alt {
          fill: #855cd6;
        }
        svg .sb3-looks-dark {
          fill: #774dcb;
        }
        
        /* Sound blocks */
        svg .sb3-sound {
          fill: #cf63cf;
          stroke: #bd42bd;
        }
        svg .sb3-sound-alt {
          fill: #c94fc9;
        }
        svg .sb3-sound-dark {
          fill: #bd42bd;
        }
        
        /* Control blocks */
        svg .sb3-control {
          fill: #ffab19;
          stroke: #cf8b17;
        }
        svg .sb3-control-alt {
          fill: #ec9c13;
        }
        svg .sb3-control-dark {
          fill: #cf8b17;
        }
        
        /* Event blocks */
        svg .sb3-events {
          fill: #ffbf00;
          stroke: #cc9900;
        }
        svg .sb3-events-alt {
          fill: #e6ac00;
        }
        svg .sb3-events-dark {
          fill: #cc9900;
        }
        
        /* Sensing blocks */
        svg .sb3-sensing {
          fill: #5cb1d6;
          stroke: #2e8eb8;
        }
        svg .sb3-sensing-alt {
          fill: #47a8d1;
        }
        svg .sb3-sensing-dark {
          fill: #2e8eb8;
        }
        
        /* Operator blocks */
        svg .sb3-operators {
          fill: #59c059;
          stroke: #389438;
        }
        svg .sb3-operators-alt {
          fill: #46b946;
        }
        svg .sb3-operators-dark {
          fill: #389438;
        }
        
        /* Variables blocks */
        svg .sb3-variables {
          fill: #ff8c1a;
          stroke: #db6e00;
        }
        svg .sb3-variables-alt {
          fill: #ff8000;
        }
        svg .sb3-variables-dark {
          fill: #db6e00;
        }
        
        /* List blocks */
        svg .sb3-list {
          fill: #ff661a;
          stroke: #e64d00;
        }
        svg .sb3-list-alt {
          fill: #ff5500;
        }
        svg .sb3-list-dark {
          fill: #e64d00;
        }
        
        svg .sb3-label {
          fill: #fff;
        }
        
        svg .sb3-input-color {
          stroke: #fff;
        }
        
        svg .sb3-input-number,
        svg .sb3-input-string {
          fill: #fff;
        }
        svg .sb3-literal-number,
        svg .sb3-literal-string {
          fill: #575e75;
        }
      `;
      
      shadow.appendChild(style);
      console.log("Added scratchblocks styles to shadow DOM");
    }

    // Since our scratchblocks code is inside the shadow DOM, get all pre.blocks elements from our shadow root.
    const preBlocks = shadow.querySelectorAll('pre.blocks');
    if (preBlocks.length === 0) {
      console.log("No scratchblocks containers to render");
      return;
    }
    console.log(`Found ${preBlocks.length} scratchblocks pre elements to render`);
    preBlocks.forEach((pre) => {
      try {
        // Render the scratchblocks code using the library's render function.
        // Instead of renderMatching, use the parse and render methods directly
        const code = unescapeHtml(pre.textContent);
        const doc = scratchblocks.parse(code, {
          languages: ['en']
        });
        const svg = scratchblocks.render(doc, {
          style: 'scratch3',
          scale: 1
        });
        
        // Make sure SVG has proper class for styling
        svg.setAttribute('class', 'scratchblocks');
        
        // Make sure all SVG elements have the proper sb3 classes
        const allPaths = svg.querySelectorAll('path');
        allPaths.forEach(path => {
          const parent = path.parentElement;
          if (parent && parent.getAttribute('class')) {
            const className = parent.getAttribute('class');
            if (className.includes('stack')) {
              // Determine block type based on text content
              const text = pre.textContent.trim().toLowerCase();
              let blockType = 'sb3-control'; // Default type
              
              if (text.includes('move') || text.includes('turn') || text.includes('direction') || text.includes('steps')) {
                blockType = 'sb3-motion';
              } else if (text.includes('say') || text.includes('costume') || text.includes('look') || text.includes('size')) {
                blockType = 'sb3-looks';
              } else if (text.includes('play') || text.includes('sound')) {
                blockType = 'sb3-sound';
              } else if (text.includes('when') || text.includes('broadcast')) {
                blockType = 'sb3-events';
              } else if (text.includes('sensing') || text.includes('touching') || text.includes('ask')) {
                blockType = 'sb3-sensing';
              } else if (text.includes('+') || text.includes('-') || text.includes('*') || text.includes('/') || 
                        text.includes('<') || text.includes('>') || text.includes('=')) {
                blockType = 'sb3-operators';
              } else if (text.includes('variable') || text.includes('my')) {
                blockType = 'sb3-variables';
              }
              
              // Add the block type class
              parent.setAttribute('class', `${parent.getAttribute('class')} ${blockType}`);
            }
          }
        });
        
        // Replace the parent container's content with the rendered SVG.
        const container = pre.parentElement;
        container.innerHTML = '';
        container.appendChild(svg);
        container.dataset.rendered = 'true';
        console.log("Successfully rendered scratchblock:", pre.textContent);
      } catch (e) {
        console.error("Error rendering scratchblock:", e);
        // Update the container with an error message
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '5px';
        errorDiv.style.background = '#ffe0e0';
        errorDiv.style.border = '1px solid red';
        errorDiv.textContent = "Failed to render Scratch block. Raw code: " + unescapeHtml(pre.textContent);
        pre.parentElement.appendChild(errorDiv);
        pre.parentElement.dataset.rendered = 'true';
      }
    });
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
      resize: none;
      font-family: inherit;
      font-size: 14px;
      outline: none;
      min-height: 50px;
      max-height: 150px;
    }

    .chat-input button {
      padding: 0 16px;
      background: #1976d2;
      color: white;
      border: none;
      cursor: pointer;
      font-weight: bold;
      transition: background 0.2s;
    }

    .chat-input button:hover {
      background: #1565c0;
    }

    .chat-input button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .message {
      margin-bottom: 16px;
      padding: 12px 16px;
      border-radius: 8px;
      max-width: 80%;
      word-wrap: break-word;
      line-height: 1.4;
      font-size: 14px;
    }

    .user-message {
      align-self: flex-end;
      background: #e3f2fd;
      color: #0d47a1;
    }

    .bot-message {
      align-self: flex-start;
      background: #fff;
      color: #333;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .thinking-message {
      align-self: flex-start;
      background: #fff;
      color: #333;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .system-message {
      align-self: center;
      background: #fff3e0;
      color: #e65100;
      font-style: italic;
      max-width: 90%;
    }

    .thinking {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 4px;
      padding: 8px 16px;
    }

    .thinking .dot {
      width: 8px;
      height: 8px;
      background: #888;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }

    .thinking .dot:nth-child(2) {
      animation-delay: 0.3s;
    }

    .thinking .dot:nth-child(3) {
      animation-delay: 0.6s;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.2); }
    }

    /* Minimized button */
    .scratch-ai-tutor-minimized-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: #1976d2;
      border-radius: 50%;
      display: none;
      justify-content: center;
      align-items: center;
      color: white;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
    }

    .minimized-close {
      position: absolute;
      top: -5px;
      right: -5px;
      width: 20px;
      height: 20px;
      background: red;
      border-radius: 50%;
      display: none;
      justify-content: center;
      align-items: center;
      color: white;
      font-size: 12px;
      cursor: pointer;
    }

    .scratch-ai-tutor-minimized-button:hover .minimized-close {
      display: block;
    }
    
    /* Scratchblocks styling */
    .scratchblocks-container {
      margin: 10px 0;
      background-color: #fff;
      border-radius: 8px;
      padding: 10px;
      overflow-x: auto;
    }
    
    .scratchblocks-container svg {
      display: block;
      margin: 0 auto;
    }
    
    pre.blocks {
      display: none; /* Hide the original code */
    }
    
    pre.code-block {
      background: #f0f0f0;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      font-family: monospace;
    }
    
    code {
      background: #f0f0f0;
      padding: 2px 4px;
      border-radius: 4px;
      font-family: monospace;
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
    if (!text) return "";
    
    // Replace code blocks with scratchblocks containers
    text = text.replace(/```scratchblocks\n([\s\S]*?)\n```/g, function(match, code) {
      console.log("Found scratchblocks code block:", code);
      return `<div class="scratchblocks-container" style="border: 2px dashed red; padding: 10px; margin: 10px 0;"><pre class="blocks">${escapeHtml(code)}</pre><div class="debug-info" style="background-color: #ffeeee; padding: 5px; font-size: 12px;">Scratch Block: "${escapeHtml(code)}" (waiting to render)</div></div>`;
    });
    
    // Replace other code blocks
    text = text.replace(/```(\w*)\n([\s\S]*?)\n```/g, function(match, language, code) {
      if (language === 'scratch') {
        console.log("Found scratch code block:", code);
        return `<div class="scratchblocks-container" style="border: 2px dashed blue; padding: 10px; margin: 10px 0;"><pre class="blocks">${escapeHtml(code)}</pre><div class="debug-info" style="background-color: #eeeeff; padding: 5px; font-size: 12px;">Scratch Block: "${escapeHtml(code)}" (waiting to render)</div></div>`;
      }
      return `<pre class="code-block ${language}">${escapeHtml(code)}</pre>`;
    });
    
    // Replace inline code
    text = text.replace(/`([^`]+)`/g, function(match, code) {
      return `<code>${escapeHtml(code)}</code>`;
    });
    
    // Replace bold text
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Replace italic text
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Replace links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Replace headers (h1, h2, h3)
    text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Replace lists
    text = text.replace(/^\s*\d+\.\s+(.*$)/gm, '<li>$1</li>');
    text = text.replace(/^\s*\*\s+(.*$)/gm, '<li>$1</li>');
    
    // Wrap adjacent list items in ul/ol
    text = text.replace(/<li>.*?<\/li>/g, function(match) {
      return '<ul>' + match + '</ul>';
    });
    
    // Replace paragraphs (two newlines)
    text = text.replace(/\n\n/g, '</p><p>');
    
    // Wrap with paragraph tags if not already wrapped
    if (!text.startsWith('<')) {
      text = '<p>' + text + '</p>';
    }
    
    return text;
  }

  // Helper to add a message
  function addMessage(content, type) {
    const messageEl = document.createElement("div");
    messageEl.className = `message ${type}-message`;
    
    // Special handling for "thinking" state
    if (type === "thinking") {
      messageEl.classList.add("thinking");
      messageEl.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
    } else if (type === "bot") {
      // Parse markdown for bot messages
      const parsedContent = parseMarkdown(content);
      messageEl.innerHTML = parsedContent;
    } else if (type === "user") {
      // User messages: simple text
      messageEl.textContent = content;
    } else if (type === "system") {
      // System messages: simple text
      messageEl.textContent = content;
    }
    
    chatBody.appendChild(messageEl);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // Render any scratchblocks in the new message if it's a bot message
    if (type === "bot") {
      setTimeout(() => {
        renderScratchblocks();
      }, 100);
    }
    
    return messageEl;
  }

  // Get elements from shadow DOM
  const systemMessageEl = shadow.getElementById("systemMessage");
  const chatBody = shadow.getElementById("chatBody");
  const userInput = shadow.getElementById("userInput");
  const sendButton = shadow.getElementById("sendButton");

  // Send question to server, with thinking indicator
  function sendQuestion() {
    const question = userInput.value.trim();
    if (!question) return;
    
    // Disable input while processing
    userInput.disabled = true;
    sendButton.disabled = true;
    
    // Add user message
    addMessage(question, "user");
    
    // Clear input
    userInput.value = "";
    
    // Add thinking indicator
    const thinkingEl = addMessage("", "thinking");
    
    // Get project ID from URL
    const projectId = getProjectId(window.location.href);
    if (!projectId) {
      chatBody.removeChild(thinkingEl);
      addMessage("Sorry, I couldn't identify the Scratch project ID from the URL.", "bot");
      userInput.disabled = false;
      sendButton.disabled = false;
      return;
    }
    
    console.log('Scratch url:', window.location.href);
    console.log('Question:', question);
    console.log('Project ID:', projectId);
    console.log('Cached token:', projectTokens[projectId] || null);
    
    // Send request to API
    fetch("https://scratch-ai-tutor.vercel.app/api/scratch-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: window.location.href,
        question: question,
        projectToken: projectTokens[projectId] || null
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      // Remove thinking indicator
      chatBody.removeChild(thinkingEl);
      
      if (data.error) {
        addMessage(`Error: ${data.error}`, "bot");
      } else {
        // Add bot response
        addMessage(data.answer, "bot");
        
        // Save tokens if provided
        if (data.projectToken && projectId) {
          projectTokens[projectId] = data.projectToken;
          saveProjectTokens();
        }
      }
    })
    .catch(error => {
      // Remove thinking indicator
      chatBody.removeChild(thinkingEl);
      
      console.error("Error:", error);
      addMessage(`Sorry, there was an error communicating with the server: ${error.message}`, "bot");
    })
    .finally(() => {
      // Re-enable input
      userInput.disabled = false;
      sendButton.disabled = false;
      userInput.focus();
    });
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

  // No need to load libraries dynamically as they are loaded as content scripts.
})();
