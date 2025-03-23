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

  // Remove Font Awesome loading as it won't work with shadow DOM
  
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
      width: 450px;
      height: 600px;
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
      min-height: 400px;
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
      transform: scale(0.85);
      transform-origin: left top;
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
      bottom: 80px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #4c97ff 0%, #4c6fff 100%);
      border-radius: 50%;
      box-shadow: 0 5px 15px rgba(76, 151, 255, 0.4);
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9999;
      transition: all 0.3s ease;
      overflow: hidden;
      border: none;
    }
    
    #minimizedButton:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(76, 151, 255, 0.5);
    }
    
    #minimizedButton:active {
      transform: translateY(-1px);
    }
    
    .scratch-cat-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 15px;
    }
    
    .chat-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 15px;
    }
    
    .minimized-close {
      display: none;
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
    
    .audio-controls {
      display: flex;
      align-items: center;
      margin-top: 10px;
      gap: 15px;
    }
    
    .circular-play-button-container {
      position: relative;
      width: 40px;
      height: 40px;
    }
    
    .play-pause-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 14px;
      height: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .play-triangle {
      width: 0;
      height: 0;
      border-top: 7px solid transparent;
      border-bottom: 7px solid transparent;
      border-left: 12px solid #4c97ff;
      margin-left: 2px;
    }
    
    .pause-icon {
      width: 14px;
      height: 14px;
      display: none;
    }
    
    .pause-icon {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .pause-icon div {
      width: 4px;
      height: 14px;
      background-color: #4c97ff;
      display: inline-block;
      margin-right: 4px;
    }
    
    .toggle-switch-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .toggle-switch {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
    }
    
    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 20px;
    }
    
    .toggle-slider::before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
    
    .toggle-switch input:checked + .toggle-slider {
      background-color: #4c97ff;
    }
    
    .toggle-switch input:checked + .toggle-slider::before {
      transform: translateX(16px);
    }
    
    .toggle-switch input:checked + .toggle-slider {
      background-color: #4c97ff;
    }
    
    .toggle-switch input:checked + .toggle-slider::before {
      transform: translateX(16px);
    }
    
    .toggle-label {
      font-size: 12px;
      color: #575e75;
      user-select: none;
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
    <div class="chat-icon">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M12 1c-6.628 0-12 4.573-12 10.213 0 2.39.932 4.591 2.427 6.164l-2.427 5.623 7.563-2.26c9.495 2.598 16.437-3.251 16.437-9.527 0-5.64-5.372-10.213-12-10.213z"/>
      </svg>
    </div>
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
 * Create audio player element with controls
 * @param {string} audioBase64 - The base64 encoded audio data
 * @param {string} audioFormat - The audio format (e.g., 'mp3')
 * @param {boolean} autoplay - Whether to autoplay the audio
 * @returns {Object} Object containing audio element and controls
 */
window.ScratchAITutor.UI.createAudioPlayer = function(audioBase64, audioFormat, autoplay = false) {
  // Create container for audio controls
  const audioContainer = document.createElement('div');
  audioContainer.className = 'audio-controls';
  audioContainer.style.display = 'flex';
  audioContainer.style.alignItems = 'center';
  audioContainer.style.marginTop = '10px';
  audioContainer.style.gap = '15px';
  
  // Create audio element
  const audio = document.createElement('audio');
  audio.src = `data:audio/${audioFormat};base64,${audioBase64}`;
  
  // Create the circular play button container
  const playButtonContainer = document.createElement('div');
  playButtonContainer.className = 'circular-play-button-container';
  playButtonContainer.style.position = 'relative';
  playButtonContainer.style.width = '40px';
  playButtonContainer.style.height = '40px';
  
  // Create the progress circle (SVG)
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "40");
  svg.setAttribute("height", "40");
  svg.setAttribute("viewBox", "0 0 40 40");
  
  // Background circle
  const bgCircle = document.createElementNS(svgNS, "circle");
  bgCircle.setAttribute("cx", "20");
  bgCircle.setAttribute("cy", "20");
  bgCircle.setAttribute("r", "18");
  bgCircle.setAttribute("fill", "none");
  bgCircle.setAttribute("stroke", "#e6e6e6");
  bgCircle.setAttribute("stroke-width", "3");
  
  // Progress circle
  const progressCircle = document.createElementNS(svgNS, "circle");
  progressCircle.setAttribute("cx", "20");
  progressCircle.setAttribute("cy", "20");
  progressCircle.setAttribute("r", "18");
  progressCircle.setAttribute("fill", "none");
  progressCircle.setAttribute("stroke", "#4c97ff");
  progressCircle.setAttribute("stroke-width", "3");
  progressCircle.setAttribute("stroke-dasharray", "113");  // Circumference = 2*PI*r
  progressCircle.setAttribute("stroke-dashoffset", "113"); // Initially, no progress
  progressCircle.setAttribute("transform", "rotate(-90 20 20)"); // Start from top
  
  svg.appendChild(bgCircle);
  svg.appendChild(progressCircle);
  playButtonContainer.appendChild(svg);
  
  // Create the play button (icon in the center)
  const playIcon = document.createElement('div');
  playIcon.className = 'play-pause-icon';
  playIcon.style.position = 'absolute';
  playIcon.style.top = '50%';
  playIcon.style.left = '50%';
  playIcon.style.transform = 'translate(-50%, -50%)';
  playIcon.style.width = '14px';
  playIcon.style.height = '14px';
  playIcon.style.display = 'flex';
  playIcon.style.alignItems = 'center';
  playIcon.style.justifyContent = 'center';
  
  // Add play icon (triangle)
  const playTriangle = document.createElement('div');
  playTriangle.className = 'play-triangle';
  playTriangle.style.width = '0';
  playTriangle.style.height = '0';
  playTriangle.style.borderTop = '7px solid transparent';
  playTriangle.style.borderBottom = '7px solid transparent';
  playTriangle.style.borderLeft = '12px solid #4c97ff';
  playTriangle.style.marginLeft = '2px'; // Offset for visual centering
  
  // Create a completely new pause icon approach
  const pauseIcon = document.createElement('div');
  pauseIcon.className = 'pause-icon';
  pauseIcon.style.position = 'absolute';
  pauseIcon.style.top = '0';
  pauseIcon.style.left = '0';
  pauseIcon.style.width = '100%';
  pauseIcon.style.height = '100%';
  pauseIcon.style.display = 'flex';
  pauseIcon.style.justifyContent = 'center';
  pauseIcon.style.alignItems = 'center';
  pauseIcon.style.visibility = 'hidden';
  
  // Create a single SVG element for the pause icon
  const pauseSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  pauseSvg.setAttribute("width", "14");
  pauseSvg.setAttribute("height", "14");
  pauseSvg.setAttribute("viewBox", "0 0 14 14");
  
  // First pause bar
  const rect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect1.setAttribute("x", "2");
  rect1.setAttribute("y", "0");
  rect1.setAttribute("width", "4");
  rect1.setAttribute("height", "14");
  rect1.setAttribute("fill", "#4c97ff");
  
  // Second pause bar
  const rect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect2.setAttribute("x", "8");
  rect2.setAttribute("y", "0");
  rect2.setAttribute("width", "4");
  rect2.setAttribute("height", "14");
  rect2.setAttribute("fill", "#4c97ff");
  
  // Add the rectangles to the SVG
  pauseSvg.appendChild(rect1);
  pauseSvg.appendChild(rect2);
  pauseIcon.appendChild(pauseSvg);
  
  playIcon.appendChild(playTriangle);
  playIcon.appendChild(pauseIcon);
  playButtonContainer.appendChild(playIcon);
  
  // Create toggle switch for autoplay
  const toggleContainer = document.createElement('div');
  toggleContainer.className = 'toggle-switch-container';
  toggleContainer.style.display = 'flex';
  toggleContainer.style.alignItems = 'center';
  toggleContainer.style.gap = '8px';
  
  // Create the toggle switch
  const toggleSwitch = document.createElement('label');
  toggleSwitch.className = 'toggle-switch';
  toggleSwitch.style.position = 'relative';
  toggleSwitch.style.display = 'inline-block';
  toggleSwitch.style.width = '36px';
  toggleSwitch.style.height = '20px';
  
  const toggleInput = document.createElement('input');
  toggleInput.type = 'checkbox';
  toggleInput.checked = window.ScratchAITutor.Storage.getAutoplayPreference() || false;
  toggleInput.style.opacity = '0';
  toggleInput.style.width = '0';
  toggleInput.style.height = '0';
  
  const toggleSlider = document.createElement('span');
  toggleSlider.className = 'toggle-slider';
  toggleSlider.style.position = 'absolute';
  toggleSlider.style.cursor = 'pointer';
  toggleSlider.style.top = '0';
  toggleSlider.style.left = '0';
  toggleSlider.style.right = '0';
  toggleSlider.style.bottom = '0';
  toggleSlider.style.backgroundColor = '#ccc';
  toggleSlider.style.transition = '.4s';
  toggleSlider.style.borderRadius = '20px';
  
  // Create the slider circle
  const toggleCircle = document.createElement('span');
  toggleCircle.style.position = 'absolute';
  toggleCircle.style.content = '""';
  toggleCircle.style.height = '16px';
  toggleCircle.style.width = '16px';
  toggleCircle.style.left = '2px';
  toggleCircle.style.bottom = '2px';
  toggleCircle.style.backgroundColor = 'white';
  toggleCircle.style.transition = '.4s';
  toggleCircle.style.borderRadius = '50%';
  
  toggleSlider.appendChild(toggleCircle);
  toggleSwitch.appendChild(toggleInput);
  toggleSwitch.appendChild(toggleSlider);
  
  // Create the label for the toggle
  const toggleLabel = document.createElement('span');
  toggleLabel.textContent = 'Autoplay';
  toggleLabel.style.fontSize = '12px';
  toggleLabel.style.color = '#575e75';
  toggleLabel.style.userSelect = 'none';
  
  toggleContainer.appendChild(toggleSwitch);
  toggleContainer.appendChild(toggleLabel);
  
  // Update toggle styling when checked
  if (toggleInput.checked) {
    toggleSlider.style.backgroundColor = '#4c97ff';
    toggleCircle.style.transform = 'translateX(16px)';
  }
  
  // Add click event to play button
  playButtonContainer.addEventListener('click', function() {
    if (audio.paused) {
      audio.play();
      playTriangle.style.visibility = 'hidden';
      pauseIcon.style.visibility = 'visible';
    } else {
      audio.pause();
      playTriangle.style.visibility = 'visible';
      pauseIcon.style.visibility = 'hidden';
    }
  });
  
  let animationFrameId = null;
  
  function updateProgressCircle() {
    if (audio.duration) {
      const progress = audio.currentTime / audio.duration;
      const dashOffset = 113 - (113 * progress);
      progressCircle.setAttribute("stroke-dashoffset", dashOffset);
      
      if (!audio.paused) {
        animationFrameId = requestAnimationFrame(updateProgressCircle);
      }
    }
  }
  
  audio.addEventListener('play', function() {
    // Start the smooth animation when playing
    animationFrameId = requestAnimationFrame(updateProgressCircle);
  });
  
  audio.addEventListener('pause', function() {
    // Stop the animation when paused
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  });
  
  // Reset when audio ends
  audio.addEventListener('ended', function() {
    playTriangle.style.visibility = 'visible';
    pauseIcon.style.visibility = 'hidden';
    progressCircle.setAttribute("stroke-dashoffset", "113");
    
    // Also cancel animation frame if it's still running
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  });
  
  // Toggle event for autoplay
  toggleInput.addEventListener('change', function() {
    window.ScratchAITutor.Storage.setAutoplayPreference(toggleInput.checked);
    
    // Update the toggle slider appearance
    if (toggleInput.checked) {
      toggleSlider.style.backgroundColor = '#4c97ff';
      toggleCircle.style.transform = 'translateX(16px)';
    } else {
      toggleSlider.style.backgroundColor = '#ccc';
      toggleCircle.style.transform = 'translateX(0)';
    }
  });
  
  // Append elements to container
  audioContainer.appendChild(playButtonContainer);
  audioContainer.appendChild(toggleContainer);
  
  // Auto-play if setting is enabled
  if (toggleInput.checked && autoplay) {
    setTimeout(() => {
      audio.play();
      playTriangle.style.visibility = 'hidden';
      pauseIcon.style.visibility = 'visible';
    }, 500); // Short delay to ensure DOM is ready
  }
  
  return {
    container: audioContainer,
    audio: audio,
    playButton: playButtonContainer,
    autoplayToggle: toggleInput
  };
};

/**
 * Add a message to the chat
 * @param {HTMLElement} chatBody - The chat body element
 * @param {ShadowRoot} shadow - The shadow DOM root
 * @param {string} content - The message content
 * @param {string} type - The message type (user or assistant)
 * @param {string} audioData - The base64 encoded audio data
 * @param {string} audioFormat - The audio format (e.g., 'mp3')
 */
window.ScratchAITutor.UI.addMessage = function(chatBody, shadow, content, type, audioData, audioFormat) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}-message`;
  
  const messageHeader = document.createElement("div");
  messageHeader.className = "message-header";
  
  const messageIcon = document.createElement("div");
  messageIcon.className = "message-icon";
  messageIcon.textContent = type === "assistant" ? "🤖" : "👤";
  
  const messageTitle = document.createElement("div");
  messageTitle.className = "message-title";
  messageTitle.textContent = type === "assistant" ? "Scratch Helper" : "You";
  
  messageHeader.appendChild(messageIcon);
  messageHeader.appendChild(messageTitle);
  
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
    
    // Add audio player if audio data is available
    if (audioData) {
      const audioPlayer = window.ScratchAITutor.UI.createAudioPlayer(
        audioData, 
        audioFormat, 
        true // Allow autoplay based on user preference
      );
      messageDiv.appendChild(audioPlayer.container);
    }
    
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

// Add storage functions for autoplay preference
window.ScratchAITutor.Storage = window.ScratchAITutor.Storage || {};
window.ScratchAITutor.Storage.getAutoplayPreference = function() {
  return JSON.parse(localStorage.getItem('scratchAITutor_autoplay') || 'false');
};
window.ScratchAITutor.Storage.setAutoplayPreference = function(value) {
  localStorage.setItem('scratchAITutor_autoplay', JSON.stringify(value));
};
