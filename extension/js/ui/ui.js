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
    // If saved dimensions exceed screen size, use percentage-based fallbacks
    const maxWidth = window.innerWidth * 0.4;
    const maxHeight = window.innerHeight * 0.8;
    
    panel.style.width = (panelPosition.width > window.innerWidth) ? maxWidth + "px" : panelPosition.width + "px";
    panel.style.height = (panelPosition.height > window.innerHeight) ? maxHeight + "px" : panelPosition.height + "px";
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
    const container = document.createElement("div");
    container.id = "scratch-ai-tutor-container";
    const shadow = container.attachShadow({ mode: "open" });
  
    // Create HTML structure with inline CSS
    shadow.innerHTML = `
      <link rel="stylesheet" href="${chrome.runtime.getURL('css/styles.css')}">
      
      <div id="scratch-ai-tutor-panel" style="position: fixed; z-index: 9999; top: initial; left: initial; bottom: 1.25rem; right: 1.25rem; height: 85%; width: 40%; background: white; border-radius: 0.625rem; box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.15); display: flex; flex-direction: column; font-family: Helvetica Neue, Helvetica, Arial, sans-serif; border: 0.0625rem solid #ddd; overflow: hidden; resize: both;">
        
        <!-- Resize handles -->
        <div id="resize-handle-e"></div>
        <div id="resize-handle-w"></div>
        <div id="resize-handle-n"></div>
        <div id="resize-handle-s"></div>
        <div id="resize-handle-ne"></div>
        <div id="resize-handle-nw"></div>
        <div id="resize-handle-se"></div>
        <div id="resize-handle-sw"></div>
        
        <!-- Header with title and buttons -->
        <div id="panel-header">
          <button class="close-button">×</button>
          <button id="clearChatButton" style="background: rgba(255, 255, 255, 0.2); border: none; color: white; font-size: 0.875rem; cursor: pointer; display: flex; align-items: center; padding: 0.375rem 0.75rem; border-radius: 1rem; margin-left: auto; transition: background-color 0.2s ease;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 0.25rem;">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Clear Chat
          </button>
        </div>
        
        <!-- System message -->
        <div id="systemMessage" style="padding: 0.625rem 0.9375rem; background: #f7f7f7; border-bottom: 0.0625rem solid #ddd; font-size: 0.875rem; color: #666;">
          Hello! I'm here to help with your Scratch project. Make sure your project is shared so I can see it.
        </div>
        
        <!-- Chat body -->
        <div id="chatBody" style="flex: 1; overflow-y: auto; padding: 0.625rem 0.9375rem; height: 60%;">
        </div>
        
        <!-- Input container -->
        <div id="inputContainer" style="display: flex; padding: 0.625rem; border-top: 0.0625rem solid #ddd;">
          <textarea id="userInput" style="flex: 1; border: 0.0625rem solid #ddd; border-radius: 1.125rem; padding: 0.625rem 0.9375rem; font-size: 0.875rem; resize: none; outline: none; max-height: 6.25rem; overflow-y: auto; cursor: text;" placeholder="Ask a question..."></textarea>
          
          <button class="send-button" style="background: #4c97ff; color: white; border: none; border-radius: 50%; width: 2.25rem; height: 2.25rem; margin-left: 0.625rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="white"/>
            </svg>
          </button>
          
          <button id="voiceRecordButton" style="background: #a83232; color: white; border: none; border-radius: 50%; width: 2.25rem; height: 2.25rem; margin-left: 0.625rem; cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative;">
            <svg class="microphone-icon" fill="white" width="18" height="18" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" xmlns:xlink="http://www.w3.org/1999/xlink" enable-background="new 0 0 512 512">
              <g>
                <g>
                  <path d="m439.5,236c0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,70-64,126.9-142.7,126.9-78.7,0-142.7-56.9-142.7-126.9 0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,86.2 71.5,157.4 163.1,166.7v57.5h-23.6c-11.3,0-20.4,9.1-20.4,20.4 0,11.3 9.1,20.4 20.4,20.4h88c11.3,0 20.4-9.1 20.4-20.4 0-11.3-9.1-20.4-20.4-20.4h-23.6v-57.5c91.6-9.3 163.1-80.5 163.1-166.7z"/>
                  <path d="m256,323.5c51,0 92.3-41.3 92.3-92.3v-127.9c0-51-41.3-92.3-92.3-92.3s-92.3,41.3-92.3,92.3v127.9c0,51 41.3,92.3 92.3,92.3zm-52.3-220.2c0-28.8 23.5-52.3 52.3-52.3s52.3,23.5 52.3,52.3v127.9c0,28.8-23.5,52.3-52.3,52.3s-52.3-23.5-52.3-52.3v-127.9z"/>
                </g>
              </g>
            </svg>
            <div class="stop-icon"></div>
            <div id="recordingIndicator" style="display: none; position: absolute; bottom: -1.5625rem; left: 50%; transform: translateX(-50%); background: rgba(255, 76, 76, 0.8); color: white; padding: 0.1875rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; white-space: nowrap;">Recording...</div>
          </button>
        </div>
        
        <!-- Toggles container -->
        <div id="modelToggleOuterContainer" style="display: flex; justify-content: center; gap: 2.5rem; align-items: center; padding: 0.5rem 0.625rem; border-top: 0.0625rem solid #eee;">
          
          <!-- Thinking Mode toggle -->
          <div class="toggle-switch-container" style="display: flex; align-items: center; gap: 0.5rem;">
            <label class="toggle-switch" style="position: relative; display: inline-block; width: 2.25rem; height: 1.25rem;">
              <input id="modelToggleInput" type="checkbox" style="opacity: 0; width: 0; height: 0;">
              <span class="toggle-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; transition: .4s; border-radius: 1.25rem; background-color: #ccc;">
                <span id="modelToggleCircle" style="position: absolute; content: ''; height: 1rem; width: 1rem; left: 0.125rem; bottom: 0.125rem; background-color: white; transition: .4s; border-radius: 50%;"></span>
              </span>
            </label>
            <span style="font-size: 0.75rem; color: #575e75; user-select: none;">Thinking Mode</span>
          </div>
          
          <!-- Screenshot toggle -->
          <div id="screenshotToggleContainer" style="display: flex; align-items: center; gap: 0.375rem;">
            <label style="position: relative; display: inline-block; width: 2.125rem; height: 1.125rem; margin: 0;">
              <input id="screenshotToggleInput" type="checkbox" style="opacity: 0; width: 0; height: 0;">
              <span id="screenshotToggleSlider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; transition: 0.4s; border-radius: 2.125rem; background-color: #ccc;">
                <span id="screenshotToggleCircle" style="position: absolute; content: ''; height: 0.875rem; width: 0.875rem; left: 0.125rem; bottom: 0.125rem; background-color: white; transition: 0.4s; border-radius: 50%;"></span>
              </span>
            </label>
            <span style="font-size: 0.75rem; color: #575e75; user-select: none;">Include Screenshot</span>
          </div>
          
          <!-- Audio Generation toggle -->
          <div style="display: flex; align-items: center; gap: 0.375rem;">
            <label style="position: relative; display: inline-block; width: 2.125rem; height: 1.125rem; margin: 0;">
              <input id="audioGenerationToggleInput" type="checkbox" style="opacity: 0; width: 0; height: 0;">
              <span id="audioGenerationToggleSlider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; transition: 0.4s; border-radius: 2.125rem; background-color: #ccc;">
                <span id="audioGenerationToggleCircle" style="position: absolute; content: ''; height: 0.875rem; width: 0.875rem; left: 0.125rem; bottom: 0.125rem; background-color: white; transition: 0.4s; border-radius: 50%;"></span>
              </span>
            </label>
            <span style="font-size: 0.75rem; color: #575e75; user-select: none;">Generate Audio</span>
          </div>
        </div>
      </div>
      
      <!-- Minimized button -->
      <div id="minimizedButton" style="position: fixed; bottom: 5rem; right: 1.25rem; width: 3.75rem; height: 3.75rem; background: #4c97ff; border-radius: 0.75rem; box-shadow: 0 0.3125rem 0.9375rem rgba(76, 151, 255, 0.4); display: none; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; z-index: 9999; transition: all 0.3s ease; overflow: hidden; border: none;">
        <div class="drag-handle" id="drag-handle" style="width: 100%; height: 25%; display: flex; justify-content: center; align-items: center; background-color: rgba(0, 0, 0, 0.2); cursor: move; border-top-left-radius: 0.75rem; border-top-right-radius: 0.75rem;">
          <div style="width: 1.875rem; height: 0.25rem; background-color: white; border-radius: 0.125rem;"></div>
        </div>
        <div class="click-area" id="click-area" style="width: 100%; height: 75%; display: flex; justify-content: center; align-items: center; background-color: transparent; cursor: pointer;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
      </div>
    `;
    
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
  
    // Get all the UI elements by ID for event handling
    const panel = shadow.getElementById("scratch-ai-tutor-panel");
    const minimizedButton = shadow.getElementById("minimizedButton");
    const systemMessageEl = shadow.getElementById("systemMessage");
    const chatBodyEl = shadow.getElementById("chatBody");
    const userInputEl = shadow.getElementById("userInput");
    const sendButtonEl = shadow.querySelector(".send-button");
    const closeButtonEl = shadow.querySelector(".close-button");
    const clearChatButtonEl = shadow.getElementById("clearChatButton");
    const voiceRecordButtonEl = shadow.getElementById("voiceRecordButton");
    const recordingIndicatorEl = shadow.getElementById("recordingIndicator");
    
    // Get toggle elements
    const modelToggleInput = shadow.getElementById("modelToggleInput");
    const modelToggleCircle = shadow.getElementById("modelToggleCircle");
    const screenshotToggleInput = shadow.getElementById("screenshotToggleInput");
    const screenshotToggleSlider = shadow.getElementById("screenshotToggleSlider");
    const screenshotToggleCircle = shadow.getElementById("screenshotToggleCircle");
    const screenshotToggleContainer = shadow.getElementById("screenshotToggleContainer");
    const audioGenerationToggleInput = shadow.getElementById("audioGenerationToggleInput");
    const audioGenerationToggleSlider = shadow.getElementById("audioGenerationToggleSlider");
    const audioGenerationToggleCircle = shadow.getElementById("audioGenerationToggleCircle");
    
    // Set initial toggle states from storage
    modelToggleInput.checked = window.BlockBuddy.Storage.getModelPreference() || false;
    if (modelToggleInput.checked) {
      modelToggleCircle.style.transform = 'translateX(1rem)';
      shadow.querySelector(".toggle-slider").style.backgroundColor = '#4c97ff';
    }
    
    screenshotToggleInput.checked = window.BlockBuddy.Storage.getScreenshotPreference();
    if (screenshotToggleInput.checked) {
      screenshotToggleCircle.style.transform = 'translateX(1rem)';
      screenshotToggleSlider.style.backgroundColor = '#4c97ff';
    }
    
    audioGenerationToggleInput.checked = window.BlockBuddy.Storage.getGenerateAudioPreference();
    if (audioGenerationToggleInput.checked) {
      audioGenerationToggleCircle.style.transform = 'translateX(1rem)';
      audioGenerationToggleSlider.style.backgroundColor = '#4c97ff';
    }
    
    // Model toggle event listener
    modelToggleInput.addEventListener('change', function() {
      const isChecked = this.checked;
      
      // Update the toggle appearance
      shadow.querySelector(".toggle-slider").style.backgroundColor = isChecked ? '#4c97ff' : '#ccc';
      modelToggleCircle.style.transform = isChecked ? 'translateX(1rem)' : 'none';
      
      // Save the preference
      window.BlockBuddy.Storage.setModelPreference(isChecked);
      console.log(`Model preference changed to: ${isChecked ? 'thinking (o4-mini)' : 'non-thinking (gpt-4.1)'}`);
      
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
        screenshotToggleContainer.style.opacity = '0.5';
        
        // Add tooltip to show explanation
        screenshotToggleContainer.title = "Screenshot feature is disabled in Thinking Mode - the thinking model doesn't support image input";
      } else {
        // Re-enable screenshot toggle
        screenshotToggleInput.disabled = false;
        screenshotToggleSlider.style.opacity = '1';
        screenshotToggleSlider.style.cursor = 'pointer';
        screenshotToggleContainer.style.opacity = '1';
        
        // Remove tooltip
        screenshotToggleContainer.title = "";
      }
    });
    
    // Screenshot toggle event listener
    screenshotToggleInput.addEventListener('change', function() {
      const isChecked = this.checked;
      
      // Update the toggle appearance
      screenshotToggleSlider.style.backgroundColor = isChecked ? '#4c97ff' : '#ccc';
      screenshotToggleCircle.style.transform = isChecked ? 'translateX(1rem)' : 'none';
      
      // Save the preference
      window.BlockBuddy.Storage.setScreenshotPreference(isChecked);
      console.log(`Screenshot preference changed to: ${isChecked ? 'enabled' : 'disabled'}`);
    });
    
    // Audio generation toggle event listener
    audioGenerationToggleInput.addEventListener('change', function() {
      const isChecked = this.checked;
      
      // Update the toggle appearance
      audioGenerationToggleSlider.style.backgroundColor = isChecked ? '#4c97ff' : '#ccc';
      audioGenerationToggleCircle.style.transform = isChecked ? 'translateX(1rem)' : 'none';
      
      // Save the preference
      window.BlockBuddy.Storage.setGenerateAudioPreference(isChecked);
      console.log(`Audio generation preference changed to: ${isChecked ? 'enabled' : 'disabled'}`);
    });
    
    // Make panel draggable by header
    const header = shadow.getElementById("panel-header");
    let isDraggingPanel = false;
    let panelOffsetX, panelOffsetY;
    
    header.addEventListener('mousedown', (e) => {
      isDraggingPanel = true;
      panelOffsetX = e.clientX - panel.getBoundingClientRect().left;
      panelOffsetY = e.clientY - panel.getBoundingClientRect().top;
      panel.style.transition = 'none'; // Disable transitions while dragging
    });
    
    // Make minimized button draggable
    const dragHandle = shadow.getElementById('drag-handle');
    const clickArea = shadow.getElementById('click-area');
    let isDraggingMinimized = false;
    let minimizedOffsetX, minimizedOffsetY;
    let wasDragging = false;
    
    dragHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isDraggingMinimized = true;
      wasDragging = false;
      minimizedOffsetX = e.clientX - minimizedButton.getBoundingClientRect().left;
      minimizedOffsetY = e.clientY - minimizedButton.getBoundingClientRect().top;
      minimizedButton.style.transition = 'none';
    });
    
    // Setup click handler for the click area
    clickArea.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Show the panel
      window.BlockBuddy.UI.showPanel(panel, minimizedButton);
    });
    
    // Global mouse events for drag and resize
    document.addEventListener('mousemove', (e) => {
      if (isDraggingPanel) {
        e.preventDefault();
        const newLeft = e.clientX - panelOffsetX;
        const newTop = e.clientY - panelOffsetY;
        
        panel.style.left = newLeft + 'px';
        panel.style.top = newTop + 'px';
        panel.style.right = 'auto';
        panel.style.bottom = 'auto';
      } else if (isDraggingMinimized) {
        e.preventDefault();
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
        panel.style.transition = '0.3s ease';
        
        // Determine which edges to snap to
        const snapEdges = window.BlockBuddy.UI.getSnapEdges(panel, 'panel');
        
        // Snap to edges
        window.BlockBuddy.UI.snapElementToEdges(panel, snapEdges, 'panel');
        
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
        wasDragging = true;
        minimizedButton.style.transition = '0.3s ease';
        
        // Determine which edge to snap to
        const snapEdges = window.BlockBuddy.UI.getSnapEdges(minimizedButton, 'minimized');
        
        // Snap to edge
        window.BlockBuddy.UI.snapElementToEdges(minimizedButton, snapEdges, 'minimized');
        
        // Save minimized button position
        let position = {
          snapEdges: snapEdges
        };
        
        // Store the free-axis position value
        const rect = minimizedButton.getBoundingClientRect();
        if (snapEdges.horizontal === 'top' || snapEdges.horizontal === 'bottom') {
          position.position = rect.left;
        } else if (snapEdges.vertical === 'left' || snapEdges.vertical === 'right') {
          position.position = rect.top;
        }
        
        window.BlockBuddy.Storage.saveMinimizedButtonPosition(position);
        
        setTimeout(() => {
          wasDragging = false;
        }, 300);
      }
    });
    
    // Add resize handle event listeners
    const directions = ['e', 'w', 'n', 's', 'ne', 'nw', 'se', 'sw'];
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
        panel.style.transition = 'none';
      });
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isResizing) {
        e.preventDefault();
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        const minWidth = 200;
        const minHeight = 300;
        
        let newWidth = originalWidth;
        let newHeight = originalHeight;
        let newX = originalX;
        let newY = originalY;
        
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
        panel.style.transition = '';
        
        const snapEdges = window.BlockBuddy.UI.getSnapEdges(panel, 'panel');
        window.BlockBuddy.UI.snapElementToEdges(panel, snapEdges, 'panel');
        
        const position = {
          snapEdges: snapEdges,
          width: panel.offsetWidth,
          height: panel.offsetHeight
        };
        window.BlockBuddy.Storage.savePanelPosition(position);
      }
    });
    
    // Add window resize event listener to handle panel size
    window.addEventListener('resize', function() {
      // Only check if the panel is visible
      if (panel.style.display !== "none") {
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const panelHeight = panel.offsetHeight;
        const panelWidth = panel.offsetWidth;
        
        // Check if panel height is larger than window height
        if (panelHeight > windowHeight * 0.9) {
          panel.style.height = '80vh';
        }
        
        // Check if panel width is larger than window width
        if (panelWidth > windowWidth * 0.5) {
          panel.style.width = '40vw';
        }
        // add small delay to allow the panel to resize
        setTimeout(() => {
          window.BlockBuddy.Storage.savePanelPosition({
            snapEdges: window.BlockBuddy.UI.getSnapEdges(panel, 'panel'),
            width: panel.offsetWidth,
            height: panel.offsetHeight
          });
        }, 100);
      }
    });
    
    // Add close button event listener
    closeButtonEl.addEventListener('click', () => {
      window.BlockBuddy.UI.hidePanel(panel, minimizedButton);
    });
    
    // Handle input focus events for styling
    userInputEl.addEventListener('focus', () => {
      shadow.getElementById("inputContainer").classList.add('focused');
    });
    
    userInputEl.addEventListener('blur', () => {
      shadow.getElementById("inputContainer").classList.remove('focused');
    });
    
    // Get stored position and size from localStorage and apply them
    const loadPanelPosition = () => {
      const position = window.BlockBuddy.Storage.getPanelPosition();
      if (position && position.snapEdges) {
        window.BlockBuddy.UI.snapElementToEdges(panel, position.snapEdges, 'panel');
      } else {
        window.BlockBuddy.UI.snapElementToEdges(panel, { horizontal: 'bottom', vertical: 'right' }, 'panel');
      }
    };
    
    const loadMinimizedButtonPosition = () => {
      const position = window.BlockBuddy.Storage.getMinimizedButtonPosition();
      if (position && position.snapEdges) {
        window.BlockBuddy.UI.snapElementToEdges(minimizedButton, position.snapEdges, 'minimized');
        if (position.position) {
          if (position.snapEdges.horizontal === 'top' || position.snapEdges.horizontal === 'bottom') {
            minimizedButton.style.left = position.position + 'px';
          } else if (position.snapEdges.vertical === 'left' || position.snapEdges.vertical === 'right') {
            if (position.position < 0) {
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
    
    // Return the created UI elements
    return {
      container,
      shadow,
      panel,
      minimizedButton,
      systemMessageEl,
      chatBodyEl,
      userInputEl,
      sendButtonEl,
      closeButtonEl,
      clearChatButtonEl,
      voiceRecordButtonEl,
      recordingIndicatorEl
    };
  };

/**
 * Create audio player element with controls
 * @param {string} audioBase64 - The base64 encoded audio data
 * @param {string} audioFormat - The audio format (e.g., 'mp3')
 * @param {boolean} autoplay - Whether to autoplay the audio
 * @param {boolean} isReloadedMessage - Whether this message is being loaded on page reload
 * @returns {Object} Object containing audio element and controls
 */
window.BlockBuddy.UI.createAudioPlayer = function(audioBase64, audioFormat, autoplay = false, isReloadedMessage = false) {
  // Create container for audio controls
  const audioContainer = document.createElement('div');
  audioContainer.className = 'audio-controls';
  
  // Get the autoplay preference
  const autoplayPreference = window.BlockBuddy.Storage.getAutoplayPreference() || false;
  
  // Create HTML with inline CSS
  audioContainer.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.9375rem;">
      <!-- Play button container -->
      <div class="circular-play-button-container" style="position: relative; width: 2.5rem; height: 2.5rem;">
        <!-- SVG for progress circle -->
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" fill="none" stroke="#e6e6e6" stroke-width="3"></circle>
          <circle class="progress-circle" cx="20" cy="20" r="18" fill="none" stroke="#4c97ff" stroke-width="3" 
            stroke-dasharray="113" stroke-dashoffset="113" transform="rotate(-90 20 20)"></circle>
        </svg>
        
        <!-- Play/pause icon -->
        <div class="play-pause-icon" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); 
          width: 0.875rem; height: 0.875rem; display: flex; align-items: center; justify-content: center;">
          
          <!-- Play triangle -->
          <div class="play-triangle" style="width: 0; height: 0; border-top: 0.4375rem solid transparent; 
            border-bottom: 0.4375rem solid transparent; border-left: 0.75rem solid #4c97ff; 
            margin-left: 0.125rem; visibility: visible;"></div>
            
          <!-- Pause icon -->
          <div class="pause-icon" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
            display: flex; justify-content: center; align-items: center; visibility: hidden;">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <rect x="2" y="0" width="4" height="14" fill="#4c97ff"></rect>
              <rect x="8" y="0" width="4" height="14" fill="#4c97ff"></rect>
            </svg>
          </div>
        </div>
      </div>
      
      <!-- Toggle switch container -->
      <div class="toggle-switch-container" style="display: flex; align-items: center; gap: 8px;">
        <label class="toggle-switch" style="position: relative; display: inline-block; width: 36px; height: 20px;">
          <input type="checkbox" class="autoplay-toggle" style="opacity: 0; width: 0; height: 0;" ${autoplayPreference ? 'checked' : ''}>
          <span class="autoplay-toggle-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; 
            transition: .4s; border-radius: 20px; background-color: ${autoplayPreference ? '#4c97ff' : '#ccc'};">
            <span class="autoplay-toggle-circle" style="position: absolute; content: ''; height: 16px; width: 16px; 
              left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; 
              transform: ${autoplayPreference ? 'translateX(16px)' : 'none'};"></span>
          </span>
        </label>
        <span style="font-size: 12px; color: #575e75; user-select: none;">Autoplay audio</span>
      </div>
    </div>
  `;
  
  // Create audio element
  const audio = document.createElement('audio');
  audio.src = `data:audio/${audioFormat};base64,${audioBase64}`;
  
  // Get elements by class/tag
  const playButtonContainer = audioContainer.querySelector('.circular-play-button-container');
  const progressCircle = audioContainer.querySelector('.progress-circle');
  const playTriangle = audioContainer.querySelector('.play-triangle');
  const pauseIcon = audioContainer.querySelector('.pause-icon');
  const toggleInput = audioContainer.querySelector('.autoplay-toggle');
  const toggleSlider = audioContainer.querySelector('.autoplay-toggle-slider');
  const toggleCircle = audioContainer.querySelector('.autoplay-toggle-circle');
  
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
      toggleCircle.style.transform = 'translateX(1rem)';
    } else {
      toggleSlider.style.backgroundColor = '#ccc';
      toggleCircle.style.transform = 'none';
    }
  });
  
  // Auto-play if setting is enabled and this is NOT a reloaded message
  if (toggleInput.checked && autoplay && !isReloadedMessage) {
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
 * @param {string} audioData - The base64 encoded audio data (optional)
 * @param {string} audioFormat - The audio format (e.g., 'mp3') (optional)
 * @param {string} messageId - The unique ID for this message (optional)
 * @param {boolean} renderScratchblocks - Whether to render scratchblocks immediately (default: true)
 * @returns {HTMLElement} The message content element for further operations
 */
window.BlockBuddy.UI.addMessage = function(chatBody, shadow, content, type, audioData, audioFormat, messageId, renderScratchblocks = true) {
  // Generate a message ID if one wasn't provided for assistant messages
  if (!messageId && type === "assistant") {
    messageId = window.BlockBuddy.Storage.generateMessageId();
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}-message`;
  
  // If we have a message ID, store it as a data attribute
  if (messageId) {
    messageDiv.dataset.messageId = messageId;
  }
  
  // Apply initial state for animation
  messageDiv.style.opacity = "0";
  messageDiv.style.transform = "translateY(20px)";
  
  const messageHeader = document.createElement("div");
  messageHeader.className = "message-header";
  
  const messageIcon = document.createElement("div");
  messageIcon.className = "message-icon";
  
  if (type === "assistant") {
    // Use the BlockBuddy icon
    const iconImg = document.createElement("img");
    iconImg.src = chrome.runtime.getURL("images/icon32.png");
    iconImg.style.width = "24px";
    iconImg.style.height = "24px";
    iconImg.style.borderRadius = "50%";
    messageIcon.appendChild(iconImg);
  } else {
    messageIcon.textContent = "👩‍💻";
  }
  
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
    
    // Check for provided audio or look for saved audio in localStorage
    if (!audioData && messageId) {
      const savedAudio = window.BlockBuddy.Storage.getMessageAudio(messageId);
      if (savedAudio && savedAudio.audioData) {
        console.log("Found saved audio for message ID:", messageId);
        audioData = savedAudio.audioData;
        audioFormat = savedAudio.audioFormat;
      } else {
        // If specific message ID doesn't have audio, check for content-based matches
        // This is useful for history messages where we might not have exact IDs
        const projectId = window.location.href.match(/\/projects\/(\d+)/)?.[1] || 'unknown';
        const allProjectAudio = window.BlockBuddy.Storage.getAllMessageAudio(projectId);
        
        // Generate a simple hash of the content to match against
        const contentHash = content.trim().substring(0, 100);
        
        // Look for any audio data that might match this message content
        for (const storedMsgId in allProjectAudio) {
          if (storedMsgId.startsWith('history_') || storedMsgId.includes(projectId)) {
            // We found audio that belongs to this project, let's use it
            console.log("Found project audio for message:", storedMsgId);
            audioData = allProjectAudio[storedMsgId].audioData;
            audioFormat = allProjectAudio[storedMsgId].audioFormat;
            
            // Save it with our current message ID for future reference
            window.BlockBuddy.Storage.saveMessageAudio(messageId, {
              audioData: audioData,
              audioFormat: audioFormat,
              timestamp: Date.now(),
              projectId: projectId,
              contentHash: contentHash
            });
            
            break;
          }
        }
      }
    }
    
    // Add audio player if audio data is available
    if (audioData) {
      // For messages loaded from history (on page reload), NEVER autoplay
      const isReloadedMessage = document.readyState === 'complete' || 
                               window.performance && 
                               window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD;
      
      // Only allow autoplay for newly generated messages, and never on page reload
      const shouldAutoplay = !isReloadedMessage && window.BlockBuddy.Storage.getAutoplayPreference();
      
      const audioPlayer = window.BlockBuddy.UI.createAudioPlayer(
        audioData, 
        audioFormat, 
        shouldAutoplay, // No autoplay on reload
        isReloadedMessage // Pass info that this is a reloaded message
      );
      messageDiv.appendChild(audioPlayer.container);
      
      // If this is new audio data being added and we have a message ID, save it
      if (messageId && !window.BlockBuddy.Storage.getMessageAudio(messageId)) {
        const projectId = window.location.href.match(/\/projects\/(\d+)/)?.[1] || 'unknown';
        window.BlockBuddy.Storage.saveMessageAudio(messageId, {
          audioData: audioData,
          audioFormat: audioFormat,
          timestamp: Date.now(),
          projectId: projectId
        });
      }
    }
    chatBody.appendChild(messageDiv);
    
    // Trigger animation after a short delay
    setTimeout(() => {
      messageDiv.style.opacity = "1";
      messageDiv.style.transform = "translateY(0)";
      messageDiv.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    }, 10);
    
    // Scroll to bottom
    chatBody.scrollTop = chatBody.scrollHeight;
    
    // If there are scratchblocks and renderScratchblocks is true, render them with a slight delay
    if (hasScratchblocks && renderScratchblocks) {
      console.log("Content contains scratchblocks, rendering immediately for this message...");
      setTimeout(() => {
        // Only render scratchblocks in this message container
        window.BlockBuddy.ScratchBlocks.renderScratchblocks(shadow, messageContent);
      }, 300); // Longer delay to ensure animation completes first
    }
  } else {
    messageContent.textContent = content;
    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(messageContent);
    chatBody.appendChild(messageDiv);
    
    // Trigger animation after a short delay
    setTimeout(() => {
      messageDiv.style.opacity = "1";
      messageDiv.style.transform = "translateY(0)";
      messageDiv.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    }, 10);
    
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
    <div class="thinking-icon">
      <img src="${chrome.runtime.getURL("images/icon32.png")}" style="width: 24px; height: 24px; border-radius: 50%;">
    </div>
    <div>
    <div class="thinking-dots">
      <div class="dot"></div>
      <div class="dot"></div>
      <div class="dot"></div>
    </div></div>
  `;
  
  // Apply initial state for animation
  thinkingDiv.style.opacity = "0";
  thinkingDiv.style.transform = "scale(0.95)";
  
  chatBody.appendChild(thinkingDiv);
  
  // Trigger animation
  setTimeout(() => {
    thinkingDiv.style.opacity = "1";
    thinkingDiv.style.transform = "scale(1)";
    thinkingDiv.style.transition = "opacity 0.3s ease, transform 0.3s ease";
  }, 10);
  
  chatBody.scrollTop = chatBody.scrollHeight;
  return thinkingDiv;
};
