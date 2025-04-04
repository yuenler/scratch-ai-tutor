// UI-related functions and components for BlockBuddy

// Create a namespace for our UI functions
window.BlockBuddy = window.BlockBuddy || {};
window.BlockBuddy.UI = window.BlockBuddy.UI || {};

// Helper functions for edge snapping
const EDGE_MARGIN = 20; // Default margin from edge for elements

// Determine which edges an element should snap to
window.BlockBuddy.UI.getSnapEdges = function(element, elementType) {
  const rect = element.getBoundingClientRect();
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  // Calculate distances to each edge
  const distToTop = rect.top;
  const distToLeft = rect.left;
  const distToRight = viewport.width - rect.right;
  const distToBottom = viewport.height - rect.bottom;
  
  // Find the closest horizontal and vertical edges
  const closestHorizontal = distToTop < distToBottom ? 'top' : 'bottom';
  const closestVertical = distToLeft < distToRight ? 'left' : 'right';
  
  // For minimized button, just snap to the single closest edge
  if (elementType === 'minimized') {
    // Find the absolute closest edge
    const minDist = Math.min(distToTop, distToLeft, distToRight, distToBottom);
    
    if (minDist === distToTop) return { horizontal: 'top', vertical: null };
    if (minDist === distToBottom) return { horizontal: 'bottom', vertical: null };
    if (minDist === distToLeft) return { horizontal: null, vertical: 'left' };
    if (minDist === distToRight) return { horizontal: null, vertical: 'right' };
  }
  
  // For panel, snap to both the closest horizontal and vertical edges
  return { horizontal: closestHorizontal, vertical: closestVertical };
};

// Position an element based on snap edges
window.BlockBuddy.UI.snapElementToEdges = function(element, snapEdges, elementType) {
  // Get the current position BEFORE resetting styles
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  // Reset all position properties
  element.style.top = 'auto';
  element.style.left = 'auto';
  element.style.right = 'auto';
  element.style.bottom = 'auto';
  
  const { horizontal, vertical } = snapEdges;
  const margin = elementType === 'minimized' ? EDGE_MARGIN : 0;
  
  if (elementType === 'minimized') {
    // For minimized button, we'll keep its position on the non-snapped axis
    if (horizontal === 'top') {
      element.style.top = margin + 'px';
      element.style.left = centerX - (element.offsetWidth / 2) + 'px';
    } else if (horizontal === 'bottom') {
      element.style.bottom = margin + 'px';
      element.style.left = centerX - (element.offsetWidth / 2) + 'px';
    } else if (vertical === 'left') {
      element.style.left = margin + 'px';
      element.style.top = centerY - (element.offsetHeight / 2) + 'px';
    } else if (vertical === 'right') {
      element.style.right = margin + 'px';
      element.style.top = centerY - (element.offsetHeight / 2) + 'px';
    }
    
    // Ensure the button stays within the viewport bounds
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const buttonWidth = element.offsetWidth;
    const buttonHeight = element.offsetHeight;
    
    // Check horizontal position
    if (element.style.left !== 'auto') {
      const leftPos = parseInt(element.style.left);
      if (leftPos < margin) {
        element.style.left = margin + 'px';
      } else if (leftPos + buttonWidth > viewportWidth - margin) {
        element.style.left = (viewportWidth - buttonWidth - margin) + 'px';
      }
    }
    
    // Check vertical position
    if (element.style.top !== 'auto') {
      const topPos = parseInt(element.style.top);
      if (topPos < margin) {
        element.style.top = margin + 'px';
      } else if (topPos + buttonHeight > viewportHeight - margin) {
        element.style.top = (viewportHeight - buttonHeight - margin) + 'px';
      }
    }
  } else {
    // For panel, apply horizontal position
    if (horizontal === 'top') {
      element.style.top = margin + 'px';
    } else if (horizontal === 'bottom') {
      element.style.bottom = margin + 'px';
    }
    
    // Apply vertical position
    if (vertical === 'left') {
      element.style.left = margin + 'px';
    } else if (vertical === 'right') {
      element.style.right = margin + 'px';
    }
  }
  
  return snapEdges;
};

/**
 * Hide the panel and show the minimized button
 * @param {HTMLElement} panel - The panel element
 * @param {HTMLElement} minimizedButton - The minimized button element
 */
window.BlockBuddy.UI.hidePanel = function(panel, minimizedButton) {
  // Get the current minimized button position from storage first
  const minimizedPosition = window.BlockBuddy.Storage.getMinimizedButtonPosition();
  
  // If we have a saved position for the minimized button, use that
  // Otherwise, default to bottom right
  let snapEdges;
  
  if (minimizedPosition && minimizedPosition.snapEdges) {
    // Use the saved position of the minimized button
    snapEdges = minimizedPosition.snapEdges;
  } 
  
  // First, hide the panel
  panel.style.display = "none";
  
  // Then, position and show the minimized button at the stored position
  minimizedButton.style.display = "flex";
  window.BlockBuddy.UI.snapElementToEdges(minimizedButton, snapEdges, 'minimized');
  
  // Save this position
  let position = {
    snapEdges: snapEdges
  };
  
  // Store the free-axis position value
  const rect = minimizedButton.getBoundingClientRect();
  if (snapEdges.horizontal === 'top' || snapEdges.horizontal === 'bottom') {
    // If snapped to top or bottom, store the left position
    position.position = rect.left;
  } else if (snapEdges.vertical === 'left' || snapEdges.vertical === 'right') {
    // If snapped to left or right, store the top position
    position.position = rect.top;
  }
  
  window.BlockBuddy.Storage.saveMinimizedButtonPosition(position);
  
  // Save the UI state as minimized
  window.BlockBuddy.Storage.saveUIState({ minimized: true });
};

/**
 * Show the panel and hide the minimized button
 * @param {HTMLElement} panel - The panel element
 * @param {HTMLElement} minimizedButton - The minimized button element
 */
window.BlockBuddy.UI.showPanel = function(panel, minimizedButton) {
  // Get the panel position from storage
  const panelPosition = window.BlockBuddy.Storage.getPanelPosition();
  
  // If we have a saved position for the panel, use that
  // Otherwise, default to bottom right
  const snapEdges = panelPosition && panelPosition.snapEdges ? 
    panelPosition.snapEdges : 
    { horizontal: 'bottom', vertical: 'right' };
  
  // First, hide the minimized button
  minimizedButton.style.display = "none";
  
  // Then, position and show the panel at the correct edges
  panel.style.display = "flex";
  window.BlockBuddy.UI.snapElementToEdges(panel, snapEdges, 'panel');
  
  // Apply saved size if available
  if (panelPosition) {
    if (panelPosition.size) {
      panel.style.width = panelPosition.size.width + "px";
      panel.style.height = panelPosition.size.height + "px";
    } else if (panelPosition.width && panelPosition.height) {
      panel.style.width = panelPosition.width + "px";
      panel.style.height = panelPosition.height + "px";
    }
  }
  
  // Save this position
  window.BlockBuddy.Storage.savePanelPosition({
    snapEdges: snapEdges,
    width: panel.offsetWidth,
    height: panel.offsetHeight
  });
  
  // Save the UI state as maximized
  window.BlockBuddy.Storage.saveUIState({ minimized: false });
};

/**
 * Create the UI for BlockBuddy
 * @returns {Object} - UI elements
 */
window.BlockBuddy.UI.createUI = function() {
  // Create container and attach a shadow DOM
  const container = document.createElement("div");
  container.id = "scratch-ai-tutor-container";
  const shadow = container.attachShadow({ mode: "open" });

  // Remove Font Awesome loading as it won't work with shadow DOM
  
  // Load scratchblocks library if not already loaded
  if (typeof window.scratchblocks === 'undefined') {
    console.log("Loading scratchblocks library...");
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('js/libs/scratchblocks-v3.6-min.js');
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
      height: 650px;
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      z-index: 9999;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      border: 1px solid #ddd;
      overflow: hidden;
      resize: both;
      min-width: 200px; /* Allow resizing to smaller widths */
      min-height: 300px; /* Allow resizing to smaller heights */
    }
    
    /* Resize handles */
    #resize-handle-e, #resize-handle-w, #resize-handle-n, #resize-handle-s,
    #resize-handle-ne, #resize-handle-nw, #resize-handle-se, #resize-handle-sw {
      position: absolute;
      z-index: 10000;
    }
    
    #resize-handle-e {
      width: 8px;
      height: calc(100% - 16px);
      top: 8px;
      right: 0;
      cursor: e-resize;
    }
    
    #resize-handle-w {
      width: 8px;
      height: calc(100% - 16px);
      top: 8px;
      left: 0;
      cursor: w-resize;
    }
    
    #resize-handle-n {
      width: calc(100% - 16px);
      height: 8px;
      top: 0;
      left: 8px;
      cursor: n-resize;
    }
    
    #resize-handle-s {
      width: calc(100% - 16px);
      height: 8px;
      bottom: 0;
      left: 8px;
      cursor: s-resize;
    }
    
    #resize-handle-ne {
      width: 12px;
      height: 12px;
      top: 0;
      right: 0;
      cursor: ne-resize;
    }
    
    #resize-handle-nw {
      width: 12px;
      height: 12px;
      top: 0;
      left: 0;
      cursor: nw-resize;
    }
    
    #resize-handle-se {
      width: 12px;
      height: 12px;
      bottom: 0;
      right: 0;
      cursor: se-resize;
    }
    
    #resize-handle-sw {
      width: 12px;
      height: 12px;
      bottom: 0;
      left: 0;
      cursor: sw-resize;
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
      cursor: move;
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
      font-size: 24px;
      font-weight: bold;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
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
      cursor: text;
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
    
    #voiceRecordButton {
      background-color: #a83232;
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
      position: relative;
    }
    
    #voiceRecordButton:hover {
      background-color: #892929;
    }
    
    #voiceRecordButton.recording {
      background-color: #ff4c4c;
      animation: pulse-recording 1.5s infinite;
    }
    
    @keyframes pulse-recording {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }
    
    .microphone-icon {
      fill: white;
      width: 18px;
      height: 18px;
    }
    
    .stop-icon {
      width: 12px;
      height: 12px;
      background-color: white;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: none;
    }
    
    #voiceRecordButton.recording .microphone-icon {
      display: none;
    }
    
    #voiceRecordButton.recording .stop-icon {
      display: block;
    }
    
    #recordingIndicator {
      display: none;
      position: absolute;
      bottom: -25px;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(255, 76, 76, 0.8);
      color: white;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
    }
    
    #voiceRecordButton.recording #recordingIndicator {
      display: block;
    }
    
    #minimizedButton {
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: #4c97ff;
      border: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9999;
      transition: all 0.3s ease;
      overflow: hidden;
      border-radius: 12px;
      box-shadow: 0 5px 15px rgba(76, 151, 255, 0.4);
      display: none;
    }
    
    #minimizedButton:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(76, 151, 255, 0.5);
    }
    
    #minimizedButton:active {
      transform: translateY(-1px);
    }
    
    #drag-handle {
      width: 100%;
      height: 25%;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.2);
      cursor: move;
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
    }
    
    #drag-handle:hover {
      background-color: rgba(0, 0, 0, 0.3);
    }
    
    .click-area {
      width: 100%;
      height: 75%;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      background-color: transparent;
    }
    
    .chat-icon {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      padding: 15px;
    }
    
    .chat-icon svg {
      width: 24px;
      height: 24px;
      fill: white;
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

  // Create panel
  const panel = document.createElement("div");
  panel.id = "scratch-ai-tutor-panel";
  shadow.appendChild(panel);
  panel.style.position = "fixed";
  panel.style.zIndex = "9999";
  panel.style.top = "initial";
  panel.style.left = "initial";
  panel.style.bottom = "20px";
  panel.style.right = "20px";
  panel.style.width = "450px";
  panel.style.height = "650px";
  panel.style.background = "white";
  panel.style.borderRadius = "10px";
  panel.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
  panel.style.display = "flex";
  panel.style.flexDirection = "column";
  panel.style.fontFamily = "Helvetica Neue, Helvetica, Arial, sans-serif";
  panel.style.border = "1px solid #ddd";
  panel.style.overflow = "hidden";
  panel.style.resize = "both";
  
  // Create resize handles
  const directions = ['e', 'w', 'n', 's', 'ne', 'nw', 'se', 'sw'];
  directions.forEach(dir => {
    const handle = document.createElement('div');
    handle.id = `resize-handle-${dir}`;
    panel.appendChild(handle);
  });

  // Create header with title and close button
  const header = document.createElement("div");
  header.id = "panel-header";
  panel.appendChild(header);

  // Create a close button
  const closeButton = document.createElement("button");
  closeButton.className = "close-button";
  closeButton.textContent = "×";
  header.appendChild(closeButton);

  // Create a clear chat button
  const clearChatButton = document.createElement("button");
  clearChatButton.id = "clearChatButton";
  clearChatButton.style.background = "rgba(255, 255, 255, 0.2)";
  clearChatButton.style.border = "none";
  clearChatButton.style.color = "white";
  clearChatButton.style.fontSize = "14px";
  clearChatButton.style.cursor = "pointer";
  clearChatButton.style.display = "flex";
  clearChatButton.style.alignItems = "center";
  clearChatButton.style.padding = "6px 12px";
  clearChatButton.style.borderRadius = "16px";
  clearChatButton.style.marginLeft = "auto";
  clearChatButton.style.transition = "background-color 0.2s ease";
  clearChatButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
    Clear Chat
  `;
  header.appendChild(clearChatButton);

  // Create system message
  const systemMessage = document.createElement("div");
  systemMessage.id = "systemMessage";
  systemMessage.style.padding = "10px 15px";
  systemMessage.style.background = "#f7f7f7";
  systemMessage.style.borderBottom = "1px solid #ddd";
  systemMessage.style.fontSize = "14px";
  systemMessage.style.color = "#666";
  systemMessage.textContent = "Hello! I'm here to help with your Scratch project. Make sure your project is shared so I can see it.";
  panel.appendChild(systemMessage);

  // Create model selection toggle container
  const modelToggleContainer = document.createElement('div');
  modelToggleContainer.className = 'toggle-switch-container';
  modelToggleContainer.style.display = 'flex';
  modelToggleContainer.style.alignItems = 'center';
  modelToggleContainer.style.gap = '8px';
  
  // Create the model toggle switch
  const modelToggleSwitch = document.createElement('label');
  modelToggleSwitch.className = 'toggle-switch';
  modelToggleSwitch.style.position = 'relative';
  modelToggleSwitch.style.display = 'inline-block';
  modelToggleSwitch.style.width = '36px';
  modelToggleSwitch.style.height = '20px';
  
  const modelToggleInput = document.createElement('input');
  modelToggleInput.type = 'checkbox';
  modelToggleInput.checked = window.BlockBuddy.Storage.getModelPreference() || false;
  modelToggleInput.style.opacity = '0';
  modelToggleInput.style.width = '0';
  modelToggleInput.style.height = '0';
  
  const modelToggleSlider = document.createElement('span');
  modelToggleSlider.className = 'toggle-slider';
  modelToggleSlider.style.position = 'absolute';
  modelToggleSlider.style.cursor = 'pointer';
  modelToggleSlider.style.top = '0';
  modelToggleSlider.style.left = '0';
  modelToggleSlider.style.right = '0';
  modelToggleSlider.style.bottom = '0';
  modelToggleSlider.style.backgroundColor = modelToggleInput.checked ? '#4c97ff' : '#ccc';
  modelToggleSlider.style.transition = '.4s';
  modelToggleSlider.style.borderRadius = '20px';
  
  // Create the slider circle
  const modelToggleCircle = document.createElement('span');
  modelToggleCircle.style.position = 'absolute';
  modelToggleCircle.style.content = '""';
  modelToggleCircle.style.height = '16px';
  modelToggleCircle.style.width = '16px';
  modelToggleCircle.style.left = '2px';
  modelToggleCircle.style.bottom = '2px';
  modelToggleCircle.style.backgroundColor = 'white';
  modelToggleCircle.style.transition = '.4s';
  modelToggleCircle.style.borderRadius = '50%';
  modelToggleCircle.style.transform = modelToggleInput.checked ? 'translateX(16px)' : 'none';
  
  modelToggleSlider.appendChild(modelToggleCircle);
  modelToggleSwitch.appendChild(modelToggleInput);
  modelToggleSwitch.appendChild(modelToggleSlider);
  
  // Create the label for the model toggle
  const modelToggleLabel = document.createElement('span');
  modelToggleLabel.textContent = 'Thinking Mode (better, but slower responses)';
  modelToggleLabel.style.fontSize = '12px';
  modelToggleLabel.style.color = '#575e75';
  modelToggleLabel.style.userSelect = 'none';
  
  modelToggleContainer.appendChild(modelToggleSwitch);
  modelToggleContainer.appendChild(modelToggleLabel);
  
  // Add event listener to save preference
modelToggleInput.addEventListener('change', function() {
  const isChecked = this.checked;
  
  // Update the toggle appearance
  modelToggleSlider.style.backgroundColor = isChecked ? '#4c97ff' : '#ccc';
  modelToggleCircle.style.transform = isChecked ? 'translateX(16px)' : 'none';
  
  // Save the preference
  window.BlockBuddy.Storage.setModelPreference(isChecked);
  console.log(`Model preference changed to: ${isChecked ? 'thinking (o3-mini)' : 'non-thinking (4o-mini)'}`);
  
  // If thinking mode is enabled, disable screenshot toggle
  if (isChecked) {
    // Turn off screenshot toggle
    screenshotToggleInput.checked = false;
    window.BlockBuddy.Storage.setScreenshotPreference(false);
    screenshotToggleSlider.style.backgroundColor = '#ccc';
    screenshotToggleCircle.style.transform = 'none';
    
    // Disable screenshot toggle
    screenshotToggleInput.disabled = true;
    screenshotToggleSlider.style.opacity = '0.5';
    screenshotToggleSlider.style.cursor = 'not-allowed';
    screenshotToggleLabel.style.opacity = '0.5';
    
    // Add tooltip to show explanation
    screenshotToggleContainer.title = "Screenshot feature is disabled in Thinking Mode - the thinking model doesn't support image input";
  } else {
    // Re-enable screenshot toggle
    screenshotToggleInput.disabled = false;
    screenshotToggleSlider.style.opacity = '1';
    screenshotToggleSlider.style.cursor = 'pointer';
    screenshotToggleLabel.style.opacity = '1';
    
    // Remove tooltip
    screenshotToggleContainer.title = "";
  }
});
  
  // Create chat body
  const chatBody = document.createElement("div");
  chatBody.id = "chatBody";
  chatBody.style.flex = "1";
  chatBody.style.overflowY = "auto";
  chatBody.style.padding = "10px 15px";
  chatBody.style.minHeight = "400px";
  panel.appendChild(chatBody);

  // Create input container
  const inputContainer = document.createElement("div");
  inputContainer.id = "inputContainer";
  inputContainer.style.display = "flex";
  inputContainer.style.padding = "10px";
  inputContainer.style.borderTop = "1px solid #ddd";
  panel.appendChild(inputContainer);

  // Create user input
  const userInput = document.createElement("textarea");
  userInput.id = "userInput";
  userInput.style.flex = "1";
  userInput.style.border = "1px solid #ddd";
  userInput.style.borderRadius = "18px";
  userInput.style.padding = "8px 15px";
  userInput.style.fontSize = "14px";
  userInput.style.resize = "none";
  userInput.style.outline = "none";
  userInput.style.maxHeight = "100px";
  userInput.style.overflowY = "auto";
  userInput.style.cursor = "text";
  userInput.placeholder = "Ask a question...";
  inputContainer.appendChild(userInput);

  // Create send button
  const sendButton = document.createElement("button");
  sendButton.id = "sendButton";
  sendButton.style.background = "#4c97ff";
  sendButton.style.color = "white";
  sendButton.style.border = "none";
  sendButton.style.borderRadius = "50%";
  sendButton.style.width = "36px";
  sendButton.style.height = "36px";
  sendButton.style.marginLeft = "10px";
  sendButton.style.cursor = "pointer";
  sendButton.style.display = "flex";
  sendButton.style.alignItems = "center";
  sendButton.style.justifyContent = "center";
  sendButton.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="white"/>
    </svg>
  `;
  inputContainer.appendChild(sendButton);

  // Create voice record button
  const voiceRecordButton = document.createElement("button");
  voiceRecordButton.id = "voiceRecordButton";
  voiceRecordButton.style.background = "#a83232";
  voiceRecordButton.style.color = "white";
  voiceRecordButton.style.border = "none";
  voiceRecordButton.style.borderRadius = "50%";
  voiceRecordButton.style.width = "36px";
  voiceRecordButton.style.height = "36px";
  voiceRecordButton.style.marginLeft = "10px";
  voiceRecordButton.style.cursor = "pointer";
  voiceRecordButton.style.display = "flex";
  voiceRecordButton.style.alignItems = "center";
  voiceRecordButton.style.justifyContent = "center";
  voiceRecordButton.style.position = "relative";
  voiceRecordButton.innerHTML = `
    <svg class="microphone-icon" fill="white" width="18" height="18" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" xmlns:xlink="http://www.w3.org/1999/xlink" enable-background="new 0 0 512 512">
      <g>
        <g>
          <path d="m439.5,236c0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,70-64,126.9-142.7,126.9-78.7,0-142.7-56.9-142.7-126.9 0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,86.2 71.5,157.4 163.1,166.7v57.5h-23.6c-11.3,0-20.4,9.1-20.4,20.4 0,11.3 9.1,20.4 20.4,20.4h88c11.3,0 20.4-9.1 20.4-20.4 0-11.3-9.1-20.4-20.4-20.4h-23.6v-57.5c91.6-9.3 163.1-80.5 163.1-166.7z"/>
          <path d="m256,323.5c51,0 92.3-41.3 92.3-92.3v-127.9c0-51-41.3-92.3-92.3-92.3s-92.3,41.3-92.3,92.3v127.9c0,51 41.3,92.3 92.3,92.3zm-52.3-220.2c0-28.8 23.5-52.3 52.3-52.3s52.3,23.5 52.3,52.3v127.9c0,28.8-23.5,52.3-52.3,52.3s-52.3-23.5-52.3-52.3v-127.9z"/>
        </g>
      </g>
    </svg>
    <div class="stop-icon"></div>
  `;
  inputContainer.appendChild(voiceRecordButton);

  // Create recording indicator
  const recordingIndicator = document.createElement("div");
  recordingIndicator.id = "recordingIndicator";
  recordingIndicator.style.display = "none";
  recordingIndicator.style.position = "absolute";
  recordingIndicator.style.bottom = "-25px";
  recordingIndicator.style.left = "50%";
  recordingIndicator.style.transform = "translateX(-50%)";
  recordingIndicator.style.background = "rgba(255, 76, 76, 0.8)";
  recordingIndicator.style.color = "white";
  recordingIndicator.style.padding = "3px 8px";
  recordingIndicator.style.borderRadius = "4px";
  recordingIndicator.style.fontSize = "12px";
  recordingIndicator.style.whiteSpace = "nowrap";
  recordingIndicator.textContent = "Recording...";
  voiceRecordButton.appendChild(recordingIndicator);

  // Create model toggle container below the input area
  const modelToggleOuterContainer = document.createElement('div');
  modelToggleOuterContainer.id = "modelToggleOuterContainer";
  modelToggleOuterContainer.style.display = "flex";
  modelToggleOuterContainer.style.justifyContent = "center";
  modelToggleOuterContainer.style.gap = "40px";
  modelToggleOuterContainer.style.alignItems = "center";
  modelToggleOuterContainer.style.padding = "8px 10px";
  modelToggleOuterContainer.style.borderTop = "1px solid #eee";
  panel.appendChild(modelToggleOuterContainer);
  
  // Add the model toggle to the container below the input area
  modelToggleOuterContainer.appendChild(modelToggleContainer);
  
  // Create screenshot toggle container
  const screenshotToggleContainer = document.createElement('div');
  screenshotToggleContainer.style.display = 'flex';
  screenshotToggleContainer.style.alignItems = 'center';
  screenshotToggleContainer.style.gap = '6px';
  
  // Create screenshot toggle switch
  const screenshotToggleSwitch = document.createElement('label');
  screenshotToggleSwitch.style.position = 'relative';
  screenshotToggleSwitch.style.display = 'inline-block';
  screenshotToggleSwitch.style.width = '34px';
  screenshotToggleSwitch.style.height = '18px';
  screenshotToggleSwitch.style.margin = '0';
  
  // Create input for toggle
  const screenshotToggleInput = document.createElement('input');
  screenshotToggleInput.id = 'screenshotToggleInput';
  screenshotToggleInput.type = 'checkbox';
  screenshotToggleInput.style.opacity = '0';
  screenshotToggleInput.style.width = '0';
  screenshotToggleInput.style.height = '0';
  
  // Check local storage for preference and set initial state
  screenshotToggleInput.checked = window.BlockBuddy.Storage.getScreenshotPreference();
  
  // Create slider
  const screenshotToggleSlider = document.createElement('span');
  screenshotToggleSlider.style.position = 'absolute';
  screenshotToggleSlider.style.cursor = 'pointer';
  screenshotToggleSlider.style.top = '0';
  screenshotToggleSlider.style.left = '0';
  screenshotToggleSlider.style.right = '0';
  screenshotToggleSlider.style.bottom = '0';
  screenshotToggleSlider.style.transition = '0.4s';
  screenshotToggleSlider.style.borderRadius = '34px';
  screenshotToggleSlider.style.backgroundColor = screenshotToggleInput.checked ? '#4c97ff' : '#ccc';
  
  // Create circle inside toggle
  const screenshotToggleCircle = document.createElement('span');
  screenshotToggleCircle.style.position = 'absolute';
  screenshotToggleCircle.style.content = '""';
  screenshotToggleCircle.style.height = '14px';
  screenshotToggleCircle.style.width = '14px';
  screenshotToggleCircle.style.left = '2px';
  screenshotToggleCircle.style.bottom = '2px';
  screenshotToggleCircle.style.backgroundColor = 'white';
  screenshotToggleCircle.style.transition = '0.4s';
  screenshotToggleCircle.style.borderRadius = '50%';
  screenshotToggleCircle.style.transform = screenshotToggleInput.checked ? 'translateX(16px)' : 'none';
  
  screenshotToggleSlider.appendChild(screenshotToggleCircle);
  screenshotToggleSwitch.appendChild(screenshotToggleInput);
  screenshotToggleSwitch.appendChild(screenshotToggleSlider);
  
  // Create the label for the screenshot toggle
  const screenshotToggleLabel = document.createElement('span');
  screenshotToggleLabel.textContent = 'Include Screenshot';
  screenshotToggleLabel.style.fontSize = '12px';
  screenshotToggleLabel.style.color = '#575e75';
  screenshotToggleLabel.style.userSelect = 'none';
  
  screenshotToggleContainer.appendChild(screenshotToggleSwitch);
  screenshotToggleContainer.appendChild(screenshotToggleLabel);
  
  // Add event listener to save preference
  screenshotToggleInput.addEventListener('change', function() {
    const isChecked = this.checked;
    
    // Update the toggle appearance
    screenshotToggleSlider.style.backgroundColor = isChecked ? '#4c97ff' : '#ccc';
    screenshotToggleCircle.style.transform = isChecked ? 'translateX(16px)' : 'none';
    
    // Save the preference
    window.BlockBuddy.Storage.setScreenshotPreference(isChecked);
    console.log(`Screenshot preference changed to: ${isChecked ? 'enabled' : 'disabled'}`);
  });
  
  // Add the screenshot toggle to the outer container
  modelToggleOuterContainer.appendChild(screenshotToggleContainer);

  // Check if thinking mode is enabled and update screenshot toggle state accordingly
  if (modelToggleInput.checked) {
    // Disable screenshot toggle if thinking mode is on
    screenshotToggleInput.disabled = true;
    screenshotToggleInput.checked = false;
    screenshotToggleSlider.style.backgroundColor = '#ccc';
    screenshotToggleCircle.style.transform = 'none';
    screenshotToggleSlider.style.opacity = '0.5';
    screenshotToggleSlider.style.cursor = 'not-allowed';
    screenshotToggleLabel.style.opacity = '0.5';
    screenshotToggleContainer.title = "Screenshot feature is disabled in Thinking Mode - the thinking model doesn't support image input";
    
    // Also update storage
    window.BlockBuddy.Storage.setScreenshotPreference(false);
  }
  
  // Create minimized button
  const minimizedButton = document.createElement("div");
  minimizedButton.id = "minimizedButton";
  shadow.appendChild(minimizedButton);
  minimizedButton.style.position = "fixed";
  minimizedButton.style.bottom = "80px";
  minimizedButton.style.right = "20px";
  minimizedButton.style.width = "60px";
  minimizedButton.style.height = "60px";
  minimizedButton.style.background = "#4c97ff";
  minimizedButton.style.borderRadius = "12px";
  minimizedButton.style.boxShadow = "0 5px 15px rgba(76, 151, 255, 0.4)";
  minimizedButton.style.display = "none";
  minimizedButton.style.flexDirection = "column";
  minimizedButton.style.alignItems = "center";
  minimizedButton.style.justifyContent = "center";
  minimizedButton.style.cursor = "pointer";
  minimizedButton.style.zIndex = "9999";
  minimizedButton.style.transition = "all 0.3s ease";
  minimizedButton.style.overflow = "hidden";
  minimizedButton.style.border = "none";
  minimizedButton.innerHTML = `
    <div class="drag-handle" id="drag-handle" style="
      width: 100%;
      height: 25%;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.2);
      cursor: move;
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
    ">
      <div style="width: 30px; height: 4px; background-color: white; border-radius: 2px;"></div>
    </div>
    <div class="click-area" id="click-area" style="
      width: 100%;
      height: 75%;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: transparent;
      cursor: pointer;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>
    </div>
  `;
  
  // Add event listeners for dragging and clicking
  const dragHandle = minimizedButton.querySelector('#drag-handle');
  const clickArea = minimizedButton.querySelector('#click-area');
  
  // Make minimized button draggable
  let isDraggingMinimized = false;
  let minimizedOffsetX, minimizedOffsetY;
  let wasDragging = false; // Flag to track if we just finished dragging
  
  dragHandle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingMinimized = true;
    wasDragging = false; // Reset the was-dragging flag
    minimizedOffsetX = e.clientX - minimizedButton.getBoundingClientRect().left;
    minimizedOffsetY = e.clientY - minimizedButton.getBoundingClientRect().top;
    minimizedButton.style.transition = 'none'; // Disable transitions while dragging
  });
  
  // Setup click handler for the click area only
  clickArea.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Show the panel
    window.BlockBuddy.UI.showPanel(panel, minimizedButton);
  });
  
  // Remove the existing click handler on the whole minimized button
  // to prevent overlapping behavior
  
  // Determine which edges an element should snap to
  const getSnapEdges = (element, elementType) => {
    return window.BlockBuddy.UI.getSnapEdges(element, elementType);
  };
  
  // Position an element based on snap edges
  const snapElementToEdges = (element, snapEdges, elementType) => {
    return window.BlockBuddy.UI.snapElementToEdges(element, snapEdges, elementType);
  };

  // Get stored position and size from localStorage
  const loadPanelPosition = () => {
    const position = window.BlockBuddy.Storage.getPanelPosition();
    if (position && position.snapEdges) {
      snapElementToEdges(panel, position.snapEdges, 'panel');
    } else {
      // Default to bottom right if no saved position
      snapElementToEdges(panel, { horizontal: 'bottom', vertical: 'right' }, 'panel');
    }
  };
  
  const loadMinimizedButtonPosition = () => {
    const position = window.BlockBuddy.Storage.getMinimizedButtonPosition();
    if (position && position.snapEdges) {
      snapElementToEdges(minimizedButton, position.snapEdges, 'minimized');
      if (position.position) {
        if (position.snapEdges.horizontal === 'top' || position.snapEdges.horizontal === 'bottom') {
          minimizedButton.style.left = position.position + 'px';
        } else if (position.snapEdges.vertical === 'left' || position.snapEdges.vertical === 'right') {
          if (position.position < 0) {
            // If position is negative, snap to bottom (default)
            minimizedButton.style.top = '80%';
          } else {
            minimizedButton.style.top = position.position + 'px';
          }
        }
      }
    }
  };

  // Load positions
  loadPanelPosition();
  loadMinimizedButtonPosition();

  // Make panel draggable by header
  let isDraggingPanel = false;
  let panelOffsetX, panelOffsetY;
  
  header.addEventListener('mousedown', (e) => {
    isDraggingPanel = true;
    panelOffsetX = e.clientX - panel.getBoundingClientRect().left;
    panelOffsetY = e.clientY - panel.getBoundingClientRect().top;
    panel.style.transition = 'none'; // Disable transitions while dragging
  });
  
  // Global mouse events for drag and resize
  document.addEventListener('mousemove', (e) => {
    if (isDraggingPanel) {
      e.preventDefault();
      // Move panel with pointer during drag (temporary positioning)
      const newLeft = e.clientX - panelOffsetX;
      const newTop = e.clientY - panelOffsetY;
      
      panel.style.left = newLeft + 'px';
      panel.style.top = newTop + 'px';
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
    } else if (isDraggingMinimized) {
      e.preventDefault();
      // Move minimized button with pointer during drag (temporary positioning)
      const newLeft = e.clientX - minimizedOffsetX;
      const newTop = e.clientY - minimizedOffsetY;
      
      minimizedButton.style.left = newLeft + 'px';
      minimizedButton.style.top = newTop + 'px';
      minimizedButton.style.right = 'auto';
      minimizedButton.style.bottom = 'auto';
    }
  });

  
  
  document.addEventListener('mouseup', () => {
    if (isDraggingPanel) {
      isDraggingPanel = false;
      panel.style.transition = '0.3s ease'; // Restore transitions
      
      // Determine which edges to snap to
      const snapEdges = getSnapEdges(panel, 'panel');
      
      // Snap to edges
      snapElementToEdges(panel, snapEdges, 'panel');
      
      // Save panel position
      const position = {
        snapEdges: snapEdges,
        width: panel.offsetWidth,
        height: panel.offsetHeight
      };
      window.BlockBuddy.Storage.savePanelPosition(position);
    }
    
    if (isDraggingMinimized) {
      isDraggingMinimized = false;
      wasDragging = true; // Set the flag that we just finished dragging
      minimizedButton.style.transition = '0.3s ease'; // Restore transitions
      
      // Determine which edge to snap to
      const snapEdges = getSnapEdges(minimizedButton, 'minimized');
      
      // Snap to edge
      snapElementToEdges(minimizedButton, snapEdges, 'minimized');
      
      // Save minimized button position
      let position = {
        snapEdges: snapEdges
      };
      
      // Store the free-axis position value
      const rect = minimizedButton.getBoundingClientRect();
      if (snapEdges.horizontal === 'top' || snapEdges.horizontal === 'bottom') {
        // If snapped to top or bottom, store the left position
        position.position = rect.left;
      } else if (snapEdges.vertical === 'left' || snapEdges.vertical === 'right') {
        // If snapped to left or right, store the top position
        position.position = rect.top;
      }
      
      window.BlockBuddy.Storage.saveMinimizedButtonPosition(position);
      
      // Use setTimeout to reset the wasDragging flag after a delay
      setTimeout(() => {
        wasDragging = false;
      }, 300);
    }
  });

  // Resize functionality
  let isResizing = false;
  let currentResizeHandle = null;
  let originalWidth, originalHeight, originalX, originalY, startX, startY;
  
  directions.forEach(dir => {
    const handle = shadow.getElementById(`resize-handle-${dir}`);
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      currentResizeHandle = dir;
      originalWidth = panel.offsetWidth;
      originalHeight = panel.offsetHeight;
      originalX = panel.getBoundingClientRect().left;
      originalY = panel.getBoundingClientRect().top;
      startX = e.clientX;
      startY = e.clientY;
      panel.style.transition = 'none'; // Disable transitions while resizing
    });
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isResizing) {
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      // Minimum dimensions
      const minWidth = 200;
      const minHeight = 300;
      
      let newWidth = originalWidth;
      let newHeight = originalHeight;
      let newX = originalX;
      let newY = originalY;
      
      // Handle different resize directions
      if (currentResizeHandle.includes('e')) {
        newWidth = Math.max(minWidth, originalWidth + dx);
      }
      if (currentResizeHandle.includes('w')) {
        const possibleWidth = Math.max(minWidth, originalWidth - dx);
        if (possibleWidth !== minWidth || dx < 0) {
          newX = originalX + originalWidth - possibleWidth;
          newWidth = possibleWidth;
        }
      }
      if (currentResizeHandle.includes('s')) {
        newHeight = Math.max(minHeight, originalHeight + dy);
      }
      if (currentResizeHandle.includes('n')) {
        const possibleHeight = Math.max(minHeight, originalHeight - dy);
        if (possibleHeight !== minHeight || dy < 0) {
          newY = originalY + originalHeight - possibleHeight;
          newHeight = possibleHeight;
        }
      }
      
      // Apply new dimensions and position
      panel.style.width = newWidth + 'px';
      panel.style.height = newHeight + 'px';
      panel.style.left = newX + 'px';
      panel.style.top = newY + 'px';
    }
  });
  
  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      currentResizeHandle = null;
      panel.style.transition = ''; // Restore transitions
      
      // After resizing, snap to appropriate edges
      const snapEdges = getSnapEdges(panel, 'panel');
      snapElementToEdges(panel, snapEdges, 'panel');
      
      // Save panel position
      const position = {
        snapEdges: snapEdges,
        width: panel.offsetWidth,
        height: panel.offsetHeight
      };
      window.BlockBuddy.Storage.savePanelPosition(position);
    }
  });

  // Add event listeners for close and clear chat buttons
  closeButton.addEventListener('click', () => {
    // Hide panel and show minimized button
    window.BlockBuddy.UI.hidePanel(panel, minimizedButton);
  });

  // Return the created UI elements
  return {
    container,
    shadow,
    panel,
    minimizedButton,
    systemMessageEl: shadow.getElementById("systemMessage"),
    chatBodyEl: shadow.getElementById("chatBody"),
    userInputEl: shadow.getElementById("userInput"),
    sendButtonEl: shadow.getElementById("sendButton"),
    closeButtonEl: shadow.querySelector(".close-button"),
    clearChatButtonEl: shadow.getElementById("clearChatButton"),
    voiceRecordButtonEl: shadow.getElementById("voiceRecordButton"),
    recordingIndicatorEl: shadow.getElementById("recordingIndicator")
  };
};

/**
 * Create audio player element with controls
 * @param {string} audioBase64 - The base64 encoded audio data
 * @param {string} audioFormat - The audio format (e.g., 'mp3')
 * @param {boolean} autoplay - Whether to autoplay the audio
 * @returns {Object} Object containing audio element and controls
 */
window.BlockBuddy.UI.createAudioPlayer = function(audioBase64, audioFormat, autoplay = false) {
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
  toggleInput.checked = window.BlockBuddy.Storage.getAutoplayPreference() || false;
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
    window.BlockBuddy.Storage.setAutoplayPreference(toggleInput.checked);
    
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
 * @param {boolean} renderScratchblocks - Whether to render scratchblocks immediately (default: true)
 * @returns {HTMLElement} The message content element for further operations
 */
window.BlockBuddy.UI.addMessage = function(chatBody, shadow, content, type, audioData, audioFormat, renderScratchblocks = true) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}-message`;
  
  const messageHeader = document.createElement("div");
  messageHeader.className = "message-header";
  
  const messageIcon = document.createElement("div");
  messageIcon.className = "message-icon";
  messageIcon.textContent = type === "assistant" ? "🧩" : "👩‍💻";
  
  const messageTitle = document.createElement("div");
  messageTitle.className = "message-title";
  messageTitle.textContent = type === "assistant" ? "BlockBuddy" : "You";
  
  messageHeader.appendChild(messageIcon);
  messageHeader.appendChild(messageTitle);
  
  const messageContent = document.createElement("div");
  messageContent.className = "message-content";
  
  // Parse markdown for assistant messages
  if (type === "assistant") {
    // Check if content contains scratchblocks code
    const hasScratchblocks = content.includes("```scratchblocks");
    
    // Parse markdown
    messageContent.innerHTML = window.BlockBuddy.Markdown.parseMarkdown(content);
    
    // Add the message to the chat first
    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(messageContent);
    
    // Add audio player if audio data is available
    if (audioData) {
      const audioPlayer = window.BlockBuddy.UI.createAudioPlayer(
        audioData, 
        audioFormat, 
        true // Allow autoplay based on user preference
      );
      messageDiv.appendChild(audioPlayer.container);
    }
    
    chatBody.appendChild(messageDiv);
    
    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // If there are scratchblocks and renderScratchblocks is true, render them with a slight delay
    if (hasScratchblocks && renderScratchblocks) {
      console.log("Content contains scratchblocks, rendering immediately for this message...");
      setTimeout(() => {
        // Only render scratchblocks in this message container
        window.BlockBuddy.ScratchBlocks.renderScratchblocks(shadow, messageContent);
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
  
  // Return the message content element for further operations
  return messageContent;
};

/**
 * Show thinking indicator
 * @param {HTMLElement} chatBody - The chat body element
 * @returns {HTMLElement} The thinking indicator element
 */
window.BlockBuddy.UI.showThinkingIndicator = function(chatBody) {
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
