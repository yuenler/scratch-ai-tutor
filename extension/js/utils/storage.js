// Storage utility functions for BlockBuddy

// Create a namespace for our storage utilities
window.BlockBuddy = window.BlockBuddy || {};
window.BlockBuddy.Storage = window.BlockBuddy.Storage || {};

// Storage key for project tokens
const STORAGE_PREFIX = 'blockBuddy_';
const PROJECT_TOKENS_KEY = STORAGE_PREFIX + 'projectTokens';
const CHAT_HISTORY_KEY = STORAGE_PREFIX + 'chatHistory';
const AUTOPLAY_KEY = STORAGE_PREFIX + 'autoplay';
const PANEL_POSITION_KEY = STORAGE_PREFIX + 'panelPosition';
const MINIMIZED_BUTTON_POSITION_KEY = STORAGE_PREFIX + 'minimizedButtonPosition';
const UI_STATE_KEY = STORAGE_PREFIX + 'uiState';


// Store project tokens for reuse
let projectTokens = {};
let chatHistory = {};

/**
 * Load saved tokens from storage
 * @returns {Promise} Promise that resolves when tokens are loaded
 */
window.BlockBuddy.Storage.loadProjectTokens = function() {
  return new Promise((resolve) => {
    try {
      const storedTokens = localStorage.getItem(PROJECT_TOKENS_KEY);
      
      if (storedTokens) {
        try {
          projectTokens = JSON.parse(storedTokens);
          console.log('Loaded project tokens from localStorage:', Object.keys(projectTokens).length);
        } catch (e) {
          console.error('Error parsing stored tokens:', e);
          projectTokens = {};
        }
      } else {
        console.log('No saved project tokens found in localStorage');
      }

      // Also load chat history
      const storedChatHistory = localStorage.getItem(CHAT_HISTORY_KEY);
      if (storedChatHistory) {
        try {
          chatHistory = JSON.parse(storedChatHistory);
          console.log('Loaded chat history from localStorage:', Object.keys(chatHistory).length);
        } catch (e) {
          console.error('Error parsing stored chat history:', e);
          chatHistory = {};
        }
      } else {
        console.log('No saved chat history found in localStorage');
      }
      
      resolve();
    } catch (e) {
      console.error('Error accessing localStorage:', e);
      resolve();
    }
  });
};

/**
 * Save tokens to storage
 */
window.BlockBuddy.Storage.saveProjectTokens = function() {
  try {
    localStorage.setItem(PROJECT_TOKENS_KEY, JSON.stringify(projectTokens));
    console.log('Project tokens saved to localStorage');
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
};

/**
 * Save chat history to storage
 */
window.BlockBuddy.Storage.saveChatHistory = function() {
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
    console.log('Chat history saved to localStorage');
  } catch (e) {
    console.error('Error saving chat history to localStorage:', e);
  }
};

/**
 * Get a project token
 * @param {string} projectId - The project ID
 * @returns {string|null} The project token or null if not found
 */
window.BlockBuddy.Storage.getProjectToken = function(projectId) {
  return projectTokens[projectId] || null;
};

/**
 * Set a project token
 * @param {string} projectId - The project ID
 * @param {string} token - The project token
 */
window.BlockBuddy.Storage.setProjectToken = function(projectId, token) {
  projectTokens[projectId] = token;
  window.BlockBuddy.Storage.saveProjectTokens();
};

/**
 * Get all project tokens
 * @returns {Object} All project tokens
 */
window.BlockBuddy.Storage.getAllProjectTokens = function() {
  return projectTokens;
};

/**
 * Get chat history for a project
 * @param {string} projectId - The project ID
 * @returns {Array} The chat history for the project or empty array if not found
 */
window.BlockBuddy.Storage.getChatHistory = function(projectId) {
  return chatHistory[projectId] || [];
};

/**
 * Add a message to the chat history
 * @param {string} projectId - The project ID
 * @param {string} message - The message text
 * @param {string} role - The role (user or assistant)
 */
window.BlockBuddy.Storage.addMessageToHistory = function(projectId, message, role) {
  if (!chatHistory[projectId]) {
    chatHistory[projectId] = [];
  }
  
  // Add message to history
  chatHistory[projectId].push({
    role: role,
    content: message,
    timestamp: Date.now()
  });
  
  // Limit history to last 10 messages per project to avoid excessive storage
  if (chatHistory[projectId].length > 10) {
    chatHistory[projectId] = chatHistory[projectId].slice(-10);
  }
  
  // Save updated history
  window.BlockBuddy.Storage.saveChatHistory();
};

/**
 * Clear chat history for a project
 * @param {string} projectId - The project ID
 */
window.BlockBuddy.Storage.clearChatHistory = function(projectId) {
  if (chatHistory[projectId]) {
    delete chatHistory[projectId];
    window.BlockBuddy.Storage.saveChatHistory();
  }
};

/**
 * Add storage functions for autoplay preference
 */
window.BlockBuddy.Storage.getAutoplayPreference = function() {
  return JSON.parse(localStorage.getItem(AUTOPLAY_KEY) || 'false');
};

window.BlockBuddy.Storage.setAutoplayPreference = function(value) {
  localStorage.setItem(AUTOPLAY_KEY, JSON.stringify(value));
};

/**
 * Add storage functions for panel position
 */
window.BlockBuddy.Storage.getPanelPosition = function() {
  const storedPosition = localStorage.getItem(PANEL_POSITION_KEY);
  if (storedPosition) {
    return JSON.parse(storedPosition);
  } else {
    return {
      snapEdges: { horizontal: 'bottom', vertical: 'right' },
      width: 450,
      height: 650
    };
  }
};

window.BlockBuddy.Storage.savePanelPosition = function(position) {
  localStorage.setItem(PANEL_POSITION_KEY, JSON.stringify(position));
};

/**
 * Add storage functions for minimized button position
 */
window.BlockBuddy.Storage.getMinimizedButtonPosition = function() {
  const storedPosition = localStorage.getItem(MINIMIZED_BUTTON_POSITION_KEY);
  if (storedPosition) {
    return JSON.parse(storedPosition);
  } else {
    return {
      snapEdges: { horizontal: 'bottom', vertical: 'right' },
      position: null
    };
  }
};

window.BlockBuddy.Storage.saveMinimizedButtonPosition = function(position) {
  localStorage.setItem(MINIMIZED_BUTTON_POSITION_KEY, JSON.stringify({
    snapEdges: position.snapEdges,
    position: position.position
  }));
};

/**
 * Add storage functions for UI state (minimized/maximized)
 */
window.BlockBuddy.Storage.getUIState = function() {
  const state = localStorage.getItem(UI_STATE_KEY);
  if (state) {
    return JSON.parse(state);
  }
  return { minimized: true }; // Default to minimized
};

window.BlockBuddy.Storage.saveUIState = function(state) {
  localStorage.setItem(UI_STATE_KEY, JSON.stringify(state));
};
