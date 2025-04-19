// Storage utility functions for BlockBuddy

// Create a namespace for our storage utilities
window.BlockBuddy = window.BlockBuddy || {};
window.BlockBuddy.Storage = window.BlockBuddy.Storage || {};

// Storage key for project tokens
const STORAGE_PREFIX = 'blockBuddy_';
const PROJECT_TOKENS_KEY = STORAGE_PREFIX + 'projectTokens';
const CHAT_HISTORY_KEY = STORAGE_PREFIX + 'chatHistory';
const AUTOPLAY_KEY = STORAGE_PREFIX + 'autoplay';
const MODEL_PREFERENCE_KEY = STORAGE_PREFIX + 'modelPreference';
const PANEL_POSITION_KEY = STORAGE_PREFIX + 'panelPosition';
const MINIMIZED_BUTTON_POSITION_KEY = STORAGE_PREFIX + 'minimizedButtonPosition';
const UI_STATE_KEY = STORAGE_PREFIX + 'uiState';
const SCREENSHOT_ENABLED_KEY = STORAGE_PREFIX + 'screenshotEnabled';
const GENERATE_AUDIO_KEY = STORAGE_PREFIX + 'generateAudio';
const MESSAGE_AUDIO_KEY = STORAGE_PREFIX + 'messageAudio';

// Store project tokens for reuse
let projectTokens = {};
let chatHistory = {};
let messageAudio = {};

/**
 * Load saved tokens from storage
 * @returns {Promise} Promise that resolves when tokens are loaded
 */
window.BlockBuddy.Storage.loadProjectTokens = function() {
  return new Promise((resolve) => {
    try {
      // Load simple preferences from localStorage (these are small and don't need chrome.storage)
      const autoplayPref = localStorage.getItem(AUTOPLAY_KEY);
      const modelPref = localStorage.getItem(MODEL_PREFERENCE_KEY);
      const uiState = localStorage.getItem(UI_STATE_KEY);
      const panelPosition = localStorage.getItem(PANEL_POSITION_KEY);
      const minimizedButtonPosition = localStorage.getItem(MINIMIZED_BUTTON_POSITION_KEY);
      const screenshotEnabled = localStorage.getItem(SCREENSHOT_ENABLED_KEY);
      const generateAudio = localStorage.getItem(GENERATE_AUDIO_KEY);
      
      // Save these to localStorage backup in case we need them
      if (autoplayPref) localStorage.setItem(AUTOPLAY_KEY, autoplayPref);
      if (modelPref) localStorage.setItem(MODEL_PREFERENCE_KEY, modelPref);
      if (uiState) localStorage.setItem(UI_STATE_KEY, uiState);
      if (panelPosition) localStorage.setItem(PANEL_POSITION_KEY, panelPosition);
      if (minimizedButtonPosition) localStorage.setItem(MINIMIZED_BUTTON_POSITION_KEY, minimizedButtonPosition);
      if (screenshotEnabled) localStorage.setItem(SCREENSHOT_ENABLED_KEY, screenshotEnabled);
      if (generateAudio) localStorage.setItem(GENERATE_AUDIO_KEY, generateAudio);
      
      // Use chrome.storage.local for potentially larger data
      chrome.storage.local.get([
        PROJECT_TOKENS_KEY, 
        CHAT_HISTORY_KEY, 
        MESSAGE_AUDIO_KEY
      ], (result) => {
        // Load project tokens
        if (result[PROJECT_TOKENS_KEY]) {
          try {
            projectTokens = result[PROJECT_TOKENS_KEY];
            console.log('Loaded project tokens from chrome.storage:', Object.keys(projectTokens).length);
          } catch (e) {
            console.error('Error processing project tokens:', e);
            projectTokens = {};
          }
        } else {
          // Try to get from localStorage as fallback for migration
          const storedTokens = localStorage.getItem(PROJECT_TOKENS_KEY);
          if (storedTokens) {
            try {
              projectTokens = JSON.parse(storedTokens);
              console.log('Migrating project tokens from localStorage:', Object.keys(projectTokens).length);
              // Save to chrome.storage for future
              chrome.storage.local.set({ [PROJECT_TOKENS_KEY]: projectTokens });
            } catch (e) {
              console.error('Error parsing stored tokens from localStorage:', e);
              projectTokens = {};
            }
          } else {
            console.log('No saved project tokens found');
          }
        }

        // Load chat history
        if (result[CHAT_HISTORY_KEY]) {
          try {
            chatHistory = result[CHAT_HISTORY_KEY];
          } catch (e) {
            console.error('Error processing chat history:', e);
            chatHistory = {};
          }
        } else {
          // Try to get from localStorage as fallback for migration
          const storedChatHistory = localStorage.getItem(CHAT_HISTORY_KEY);
          if (storedChatHistory) {
            try {
              chatHistory = JSON.parse(storedChatHistory);
              console.log('Migrating chat history from localStorage');
              // Save to chrome.storage for future
              chrome.storage.local.set({ [CHAT_HISTORY_KEY]: chatHistory });
            } catch (e) {
              console.error('Error parsing stored chat history from localStorage:', e);
              chatHistory = {};
            }
          } else {
            console.log('No saved chat history found');
          }
        }
        
        // Load message audio data
        if (result[MESSAGE_AUDIO_KEY]) {
          try {
            messageAudio = result[MESSAGE_AUDIO_KEY];
            console.log('Loaded message audio data from chrome.storage:', Object.keys(messageAudio).length);
          } catch (e) {
            console.error('Error processing message audio:', e);
            messageAudio = {};
          }
        } else {
          // Try to get from localStorage as fallback for migration
          const storedMessageAudio = localStorage.getItem(MESSAGE_AUDIO_KEY);
          if (storedMessageAudio) {
            try {
              messageAudio = JSON.parse(storedMessageAudio);
              console.log('Migrating message audio data from localStorage:', Object.keys(messageAudio).length);
              // Save to chrome.storage for future
              chrome.storage.local.set({ [MESSAGE_AUDIO_KEY]: messageAudio });
              // Clear from localStorage to free up space
              localStorage.removeItem(MESSAGE_AUDIO_KEY);
            } catch (e) {
              console.error('Error parsing stored message audio from localStorage:', e);
              messageAudio = {};
            }
          } else {
            console.log('No saved message audio found');
          }
        }
        
        resolve();
      });
    } catch (e) {
      console.error('Error accessing storage:', e);
      resolve();
    }
  });
};

/**
 * Save tokens to storage
 */
window.BlockBuddy.Storage.saveProjectTokens = function() {
  try {
    chrome.storage.local.set({ [PROJECT_TOKENS_KEY]: projectTokens }, function() {
      console.log('Project tokens saved to chrome.storage');
    });
  } catch (e) {
    console.error('Error saving to chrome.storage:', e);
    // Fallback to localStorage
    localStorage.setItem(PROJECT_TOKENS_KEY, JSON.stringify(projectTokens));
  }
};

/**
 * Save chat history to storage
 */
window.BlockBuddy.Storage.saveChatHistory = function() {
  try {
    chrome.storage.local.set({ [CHAT_HISTORY_KEY]: chatHistory }, function() {
      console.log('Chat history saved to chrome.storage');
    });
  } catch (e) {
    console.error('Error saving chat history to chrome.storage:', e);
    // Fallback to localStorage
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
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
 * @param {string} messageId - The message ID (optional)
 */
window.BlockBuddy.Storage.addMessageToHistory = function(projectId, message, role, messageId) {
  if (!chatHistory[projectId]) {
    chatHistory[projectId] = [];
  }
  
  // Add message to history
  chatHistory[projectId].push({
    role: role,
    content: message,
    timestamp: Date.now(),
    messageId: messageId || null
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
 * Add storage functions for audio generation preference
 */
window.BlockBuddy.Storage.getGenerateAudioPreference = function() {
  return JSON.parse(localStorage.getItem(GENERATE_AUDIO_KEY) || 'true');
};

window.BlockBuddy.Storage.setGenerateAudioPreference = function(value) {
  localStorage.setItem(GENERATE_AUDIO_KEY, JSON.stringify(value));
};

/**
 * Add storage functions for message audio data
 */
window.BlockBuddy.Storage.getMessageAudio = function(messageId) {
  return messageAudio[messageId] || null;
};

window.BlockBuddy.Storage.getAllMessageAudio = function(projectId) {
  // Filter messages by project ID if provided
  if (projectId) {
    const projectMessages = {};
    for (const messageId in messageAudio) {
      if (messageAudio[messageId].projectId === projectId) {
        projectMessages[messageId] = messageAudio[messageId];
      }
    }
    return projectMessages;
  }
  return messageAudio;
};

window.BlockBuddy.Storage.saveMessageAudio = function(messageId, data) {
  messageAudio[messageId] = data;
  try {
    chrome.storage.local.set({ [MESSAGE_AUDIO_KEY]: messageAudio }, function() {
      console.log('Message audio saved to chrome.storage for message:', messageId);
    });
  } catch (e) {
    console.error('Error saving message audio to chrome.storage:', e);
    
    // If there's an error, try to clean up old audio data
    const keys = Object.keys(messageAudio);
    if (keys.length > 10) {
      console.log('Cleaning up old audio data...');
      // Sort by timestamp and remove oldest entries
      const sortedKeys = keys.sort((a, b) => messageAudio[a].timestamp - messageAudio[b].timestamp);
      const keysToRemove = sortedKeys.slice(0, Math.ceil(keys.length / 2)); // Remove half of the entries
      
      keysToRemove.forEach(key => {
        delete messageAudio[key];
      });
      
      // Try saving again
      try {
        chrome.storage.local.set({ [MESSAGE_AUDIO_KEY]: messageAudio }, function() {
          console.log('Cleaned up old audio data and saved successfully');
        });
      } catch (cleanupError) {
        console.error('Still unable to save after cleanup:', cleanupError);
      }
    }
  }
};

window.BlockBuddy.Storage.removeMessageAudio = function(messageId) {
  if (messageAudio[messageId]) {
    delete messageAudio[messageId];
    chrome.storage.local.set({ [MESSAGE_AUDIO_KEY]: messageAudio }, function() {
      console.log('Removed audio for message:', messageId);
    });
    return true;
  }
  return false;
};

window.BlockBuddy.Storage.clearAllMessageAudio = function() {
  messageAudio = {};
  chrome.storage.local.set({ [MESSAGE_AUDIO_KEY]: messageAudio }, function() {
    console.log('Cleared all message audio data');
  });
};

/**
 * Generate a unique message ID
 * @returns {string} A unique message ID
 */
window.BlockBuddy.Storage.generateMessageId = function() {
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `msg_${timestamp}_${randomPart}`;
};

/**
 * Add storage functions for model preference (thinking vs non-thinking)
 * Returns true for thinking model (o3-mini), false for non-thinking model (4o-mini)
 */
window.BlockBuddy.Storage.getModelPreference = function() {
  return JSON.parse(localStorage.getItem(MODEL_PREFERENCE_KEY) || 'true');
};

window.BlockBuddy.Storage.setModelPreference = function(value) {
  localStorage.setItem(MODEL_PREFERENCE_KEY, JSON.stringify(value));
};

/**
 * Add storage functions for panel position
 */
window.BlockBuddy.Storage.getPanelPosition = function() {
  try {
    const data = localStorage.getItem(PANEL_POSITION_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (e) {
    console.error('Error getting panel position:', e);
    return null;
  }
};

window.BlockBuddy.Storage.savePanelPosition = function(position) {
  localStorage.setItem(PANEL_POSITION_KEY, JSON.stringify(position));
};

/**
 * Add storage functions for minimized button position
 */
window.BlockBuddy.Storage.getMinimizedButtonPosition = function() {
  try {
    const data = localStorage.getItem(MINIMIZED_BUTTON_POSITION_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (e) {
    console.error('Error getting minimized button position:', e);
    return null;
  }
};

window.BlockBuddy.Storage.saveMinimizedButtonPosition = function(position) {
  localStorage.setItem(MINIMIZED_BUTTON_POSITION_KEY, JSON.stringify(position));
};

/**
 * Add storage functions for UI state (minimized/maximized)
 */
window.BlockBuddy.Storage.getUIState = function() {
  try {
    const data = localStorage.getItem(UI_STATE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error getting UI state:', e);
  }
  return { minimized: false }; // Default to maximized
};

window.BlockBuddy.Storage.saveUIState = function(state) {
  localStorage.setItem(UI_STATE_KEY, JSON.stringify(state));
};

/**
 * Add storage functions for screenshot preference
 */
window.BlockBuddy.Storage.getScreenshotPreference = function() {
  return JSON.parse(localStorage.getItem(SCREENSHOT_ENABLED_KEY) || 'false');
};

window.BlockBuddy.Storage.setScreenshotPreference = function(value) {
  localStorage.setItem(SCREENSHOT_ENABLED_KEY, JSON.stringify(value));
};
