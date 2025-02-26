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

  // Load scratchblocks libraries by fetching them and injecting as inline scripts
  function injectScratchblocksLibraries() {
    console.log("Injecting scratchblocks libraries directly...");
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.scratchblocksLoaded) {
        console.log("Scratchblocks already loaded via injection");
        resolve();
        return;
      }
      
      // Get the URLs for the library files
      const scratchblocksUrl = chrome.runtime.getURL("lib/scratchblocks-min.js");
      const translationsUrl = chrome.runtime.getURL("lib/translations-all.js");
      
      console.log("Fetching library from:", scratchblocksUrl);
      
      // Fetch the main library
      fetch(scratchblocksUrl)
        .then(response => response.text())
        .then(scratchblocksCode => {
          console.log("Fetched scratchblocks library, size:", scratchblocksCode.length);
          
          // Create script element for main library
          const script1 = document.createElement('script');
          script1.textContent = scratchblocksCode + "\n//# sourceURL=scratchblocks-min.js";
          
          // Append to document
          (document.head || document.documentElement).appendChild(script1);
          console.log("Injected scratchblocks library");
          
          // Now fetch translations
          return fetch(translationsUrl);
        })
        .then(response => response.text())
        .then(translationsCode => {
          console.log("Fetched translations library, size:", translationsCode.length);
          
          // Create script element for translations
          const script2 = document.createElement('script');
          script2.textContent = translationsCode + "\n//# sourceURL=translations-all.js";
          
          // Append to document
          (document.head || document.documentElement).appendChild(script2);
          console.log("Injected translations library");
          
          // Check if scratchblocks is available in the window context
          const checkScript = document.createElement('script');
          checkScript.textContent = `
            window.scratchblocksLoaded = (typeof scratchblocks !== 'undefined');
            console.log("Direct check for scratchblocks:", window.scratchblocksLoaded);
            
            // Create a global render function for direct access
            if (window.scratchblocksLoaded) {
              window.renderScratchBlock = function(code, containerId) {
                try {
                  const svg = scratchblocks.render(code, { style: 'scratch3', languages: ['en'] });
                  const container = document.getElementById(containerId);
                  if (container) {
                    container.innerHTML = '';
                    container.appendChild(svg);
                    container.dataset.rendered = 'true';
                    return true;
                  }
                  return false;
                } catch (e) {
                  console.error("Error in renderScratchBlock:", e);
                  return false;
                }
              };
            }
            
            // Add a flag to document for content script to check
            document.body.dataset.scratchblocksLoaded = window.scratchblocksLoaded ? 'true' : 'false';
          `;
          
          // Append check script
          (document.head || document.documentElement).appendChild(checkScript);
          
          // Give a moment for scripts to execute
          setTimeout(() => {
            const loaded = document.body.dataset.scratchblocksLoaded === 'true';
            console.log("Scratchblocks loaded check:", loaded);
            
            if (loaded) {
              window.scratchblocksLoaded = true;
              resolve();
            } else {
              console.error("Failed to initialize scratchblocks after direct injection");
              reject(new Error("Failed to initialize scratchblocks after direct injection"));
            }
          }, 200);
        })
        .catch(error => {
          console.error("Error injecting scratchblocks libraries:", error);
          reject(error);
        });
    });
  }

  // Function to render scratchblocks in shadow DOM
  function renderScratchblocks() {
    console.log("Attempting to render scratchblocks...");
    
    // Find all unrendered scratchblocks containers
    const containers = shadow.querySelectorAll('.scratchblocks-container:not([data-rendered="true"])');
    if (containers.length === 0) {
      console.log("No scratchblocks containers to render");
      return;
    }
    
    console.log(`Found ${containers.length} scratchblocks containers to render`);
    
    // Load libraries first if not already loaded
    injectScratchblocksLibraries()
      .then(() => {
        // Process each container
        containers.forEach((container, index) => {
          const codeElement = container.querySelector('pre.blocks');
          if (!codeElement) {
            console.error("No pre.blocks element found in container", container);
            return;
          }
          
          // Get the block code
          const code = codeElement.textContent;
          console.log("Rendering scratchblock with content:", code);
          
          try {
            // Create a temporary div in the main document to render the block
            const tempDiv = document.createElement('div');
            const tempId = `temp-scratchblock-${Date.now()}-${index}`;
            tempDiv.id = tempId;
            document.body.appendChild(tempDiv);
            
            // Use the injected render function directly
            const executeScript = document.createElement('script');
            executeScript.textContent = `
              try {
                const success = window.renderScratchBlock(${JSON.stringify(code)}, ${JSON.stringify(tempId)});
                console.log("Direct render result:", success);
              } catch (e) {
                console.error("Error in direct render:", e);
              }
            `;
            document.body.appendChild(executeScript);
            
            // Wait a moment for the rendering to complete
            setTimeout(() => {
              // Check if the block was rendered
              if (tempDiv.dataset.rendered === 'true' && tempDiv.firstChild) {
                // Log the HTML content for debugging
                console.log("Generated HTML content:", tempDiv.innerHTML);
                console.log("First child node type:", tempDiv.firstChild.nodeName);
                console.log("First child outerHTML:", tempDiv.firstChild.outerHTML);
                
                // Move the rendered SVG to the shadow DOM
                container.innerHTML = '';
                container.appendChild(tempDiv.firstChild.cloneNode(true));
                container.dataset.rendered = 'true';
                console.log("Successfully moved rendered block to shadow DOM");
                
                // Log the final container content
                console.log("Container after moving block:", container.innerHTML);
              } else {
                console.error("Failed to render scratchblock using direct method");
                console.log("tempDiv state:", {
                  rendered: tempDiv.dataset.rendered,
                  hasChild: Boolean(tempDiv.firstChild),
                  innerHTML: tempDiv.innerHTML
                });
                
                // Update the container with an error message
                const errorDiv = document.createElement('div');
                errorDiv.style.color = 'red';
                errorDiv.style.padding = '5px';
                errorDiv.style.background = '#ffe0e0';
                errorDiv.style.border = '1px solid red';
                errorDiv.textContent = "Failed to render Scratch block. Raw code: " + code;
                
                // Keep the original code and add the error message
                container.appendChild(errorDiv);
                container.dataset.rendered = 'true'; // Mark as "rendered" to avoid infinite retry
              }
              
              // Clean up
              document.body.removeChild(tempDiv);
              document.body.removeChild(executeScript);
            }, 100);
          } catch (e) {
            console.error("Error setting up scratchblock rendering:", e);
            
            // Update the container with an error message
            const errorDiv = document.createElement('div');
            errorDiv.style.color = 'red';
            errorDiv.style.padding = '5px';
            errorDiv.style.background = '#ffe0e0';
            errorDiv.style.border = '1px solid red';
            errorDiv.textContent = "Error setting up Scratch block rendering: " + e.message + ". Raw code: " + code;
            
            // Keep the original code and add the error message
            container.appendChild(errorDiv);
            container.dataset.rendered = 'true'; // Mark as "rendered" to avoid infinite retry
          }
        });
      })
      .catch(err => {
        console.error("Error loading libraries before rendering:", err);
        
        // Update all containers with an error message
        containers.forEach(container => {
          const codeElement = container.querySelector('pre.blocks');
          const code = codeElement ? codeElement.textContent : "unknown";
          
          const errorDiv = document.createElement('div');
          errorDiv.style.color = 'red';
          errorDiv.style.padding = '5px';
          errorDiv.style.background = '#ffe0e0';
          errorDiv.style.border = '1px solid red';
          errorDiv.textContent = "Failed to load Scratch blocks libraries. Raw code: " + code;
          
          // Keep the original code and add the error message
          container.appendChild(errorDiv);
          container.dataset.rendered = 'true'; // Mark as "rendered" to avoid infinite retry
        });
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
      return `<div class="scratchblocks-container" style="border: 2px dashed red; padding: 10px; margin: 10px 0;"><pre class="blocks">${code}</pre><div class="debug-info" style="background-color: #ffeeee; padding: 5px; font-size: 12px;">Scratch Block: "${code}" (waiting to render)</div></div>`;
    });
    
    // Replace other code blocks
    text = text.replace(/```(\w*)\n([\s\S]*?)\n```/g, function(match, language, code) {
      if (language === 'scratch') {
        console.log("Found scratch code block:", code);
        return `<div class="scratchblocks-container" style="border: 2px dashed blue; padding: 10px; margin: 10px 0;"><pre class="blocks">${code}</pre><div class="debug-info" style="background-color: #eeeeff; padding: 5px; font-size: 12px;">Scratch Block: "${code}" (waiting to render)</div></div>`;
      }
      return `<pre class="code-block ${language}">${code}</pre>`;
    });
    
    // Replace inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
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

  // Load libraries
  injectScratchblocksLibraries();
})();
