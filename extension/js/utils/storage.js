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

// Cache for simple preferences to avoid excessive chrome.storage calls
// These are initial values that will be immediately replaced with saved values 
// from chrome.storage when loadProjectTokens() is called
let preferencesCache = {
  autoplay: null,
  modelPreference: null,
  uiState: { minimized: false }, // Must initialize with valid object to prevent null reference errors
  panelPosition: null,
  minimizedButtonPosition: null,
  screenshotEnabled: null, 
  generateAudio: null
};

/**
 * Load saved tokens from storage
 * @returns {Promise} Promise that resolves when tokens are loaded
 */
window.BlockBuddy.Storage.loadProjectTokens = function() {
  return new Promise((resolve) => {
    try {
      // Use chrome.storage.local for all data
      chrome.storage.local.get([
        PROJECT_TOKENS_KEY, 
        CHAT_HISTORY_KEY, 
        MESSAGE_AUDIO_KEY,
        AUTOPLAY_KEY,
        MODEL_PREFERENCE_KEY,
        UI_STATE_KEY,
        PANEL_POSITION_KEY,
        MINIMIZED_BUTTON_POSITION_KEY,
        SCREENSHOT_ENABLED_KEY,
        GENERATE_AUDIO_KEY
      ], (result) => {
        // Define default values to use only when preference doesn't exist
        const defaultValues = {
          autoplay: false,
          modelPreference: false,
          uiState: { minimized: false },
          screenshotEnabled: false,
          generateAudio: false,
          minimizedButtonPosition: { position: 100, snapEdges: { horizontal: null, vertical: 'right' } }
        };

        // Load each preference, using default only if completely undefined
        preferencesCache.autoplay = result[AUTOPLAY_KEY] !== undefined ? result[AUTOPLAY_KEY] : defaultValues.autoplay;
        preferencesCache.modelPreference = result[MODEL_PREFERENCE_KEY] !== undefined ? result[MODEL_PREFERENCE_KEY] : defaultValues.modelPreference;
        preferencesCache.uiState = result[UI_STATE_KEY] || defaultValues.uiState;
        preferencesCache.panelPosition = result[PANEL_POSITION_KEY] || null;
        preferencesCache.minimizedButtonPosition = result[MINIMIZED_BUTTON_POSITION_KEY] || defaultValues.minimizedButtonPosition;
        preferencesCache.screenshotEnabled = result[SCREENSHOT_ENABLED_KEY] !== undefined ? result[SCREENSHOT_ENABLED_KEY] : defaultValues.screenshotEnabled;
        preferencesCache.generateAudio = result[GENERATE_AUDIO_KEY] !== undefined ? result[GENERATE_AUDIO_KEY] : defaultValues.generateAudio;
        
        // Save default values to storage if they weren't already set
        // This initializes storage the first time but doesn't overwrite existing values
        const missingPreferences = {};
        if (result[AUTOPLAY_KEY] === undefined) missingPreferences[AUTOPLAY_KEY] = defaultValues.autoplay;
        if (result[MODEL_PREFERENCE_KEY] === undefined) missingPreferences[MODEL_PREFERENCE_KEY] = defaultValues.modelPreference;
        if (!result[UI_STATE_KEY]) missingPreferences[UI_STATE_KEY] = defaultValues.uiState;
        if (result[SCREENSHOT_ENABLED_KEY] === undefined) missingPreferences[SCREENSHOT_ENABLED_KEY] = defaultValues.screenshotEnabled;
        if (result[GENERATE_AUDIO_KEY] === undefined) missingPreferences[GENERATE_AUDIO_KEY] = defaultValues.generateAudio;
        
        // If any preferences were missing, save the defaults to storage
        if (Object.keys(missingPreferences).length > 0) {
          chrome.storage.local.set(missingPreferences);
        }
        
        // Load project tokens
        if (result[PROJECT_TOKENS_KEY]) {
          try {
            projectTokens = result[PROJECT_TOKENS_KEY];
          } catch (e) {
            console.error('Error processing project tokens:', e);
            projectTokens = {};
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
        }
        
        // Load message audio data
        if (result[MESSAGE_AUDIO_KEY]) {
          try {
            messageAudio = result[MESSAGE_AUDIO_KEY];
          } catch (e) {
            console.error('Error processing message audio:', e);
            messageAudio = {};
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
  chrome.storage.local.set({ [PROJECT_TOKENS_KEY]: projectTokens }, function() {});
};

/**
 * Save chat history to storage
 */
window.BlockBuddy.Storage.saveChatHistory = function() {
  chrome.storage.local.set({ [CHAT_HISTORY_KEY]: chatHistory }, function() {});
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
  return preferencesCache.autoplay;
};

window.BlockBuddy.Storage.setAutoplayPreference = function(value) {
  preferencesCache.autoplay = value;
  chrome.storage.local.set({ [AUTOPLAY_KEY]: value }, function() {});
};

/**
 * Add storage functions for audio generation preference
 */
window.BlockBuddy.Storage.getGenerateAudioPreference = function() {
  return preferencesCache.generateAudio;
};

window.BlockBuddy.Storage.setGenerateAudioPreference = function(value) {
  preferencesCache.generateAudio = value;
  chrome.storage.local.set({ [GENERATE_AUDIO_KEY]: value }, function() {});
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
    chrome.storage.local.set({ [MESSAGE_AUDIO_KEY]: messageAudio }, function() {});
  } catch (e) {
    console.error('Error saving message audio to chrome.storage:', e);
    
    // If there's an error, try to clean up old audio data
    const keys = Object.keys(messageAudio);
    if (keys.length > 10) {
      // Sort by timestamp and remove oldest entries
      const sortedKeys = keys.sort((a, b) => messageAudio[a].timestamp - messageAudio[b].timestamp);
      const keysToRemove = sortedKeys.slice(0, Math.ceil(keys.length / 2)); // Remove half of the entries
      
      keysToRemove.forEach(key => {
        delete messageAudio[key];
      });
      
      // Try saving again
      try {
        chrome.storage.local.set({ [MESSAGE_AUDIO_KEY]: messageAudio }, function() {});
      } catch (cleanupError) {
        console.error('Still unable to save after cleanup:', cleanupError);
      }
    }
  }
};

window.BlockBuddy.Storage.removeMessageAudio = function(messageId) {
  if (messageAudio[messageId]) {
    delete messageAudio[messageId];
    chrome.storage.local.set({ [MESSAGE_AUDIO_KEY]: messageAudio }, function() {});
    return true;
  }
  return false;
};

window.BlockBuddy.Storage.clearAllMessageAudio = function() {
  messageAudio = {};
  chrome.storage.local.set({ [MESSAGE_AUDIO_KEY]: messageAudio }, function() {});
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
 * Returns true for thinking model (o4-mini), false for non-thinking model (gpt-4.1)
 */
window.BlockBuddy.Storage.getModelPreference = function() {
  return preferencesCache.modelPreference;
};

window.BlockBuddy.Storage.setModelPreference = function(value) {
  preferencesCache.modelPreference = value;
  chrome.storage.local.set({ [MODEL_PREFERENCE_KEY]: value }, function() {});
};

/**
 * Add storage functions for panel position
 */
window.BlockBuddy.Storage.getPanelPosition = function() {
  return preferencesCache.panelPosition;
};

window.BlockBuddy.Storage.savePanelPosition = function(position) {
  preferencesCache.panelPosition = position;
  chrome.storage.local.set({ [PANEL_POSITION_KEY]: position }, function() {});
};

/**
 * Add storage functions for minimized button position
 */
window.BlockBuddy.Storage.getMinimizedButtonPosition = function() {
  return preferencesCache.minimizedButtonPosition;
};

window.BlockBuddy.Storage.saveMinimizedButtonPosition = function(position) {
  preferencesCache.minimizedButtonPosition = position;
  chrome.storage.local.set({ [MINIMIZED_BUTTON_POSITION_KEY]: position }, function() {});
};

/**
 * Add storage functions for UI state (minimized/maximized)
 */
window.BlockBuddy.Storage.getUIState = function() {
  return preferencesCache.uiState;
};

window.BlockBuddy.Storage.saveUIState = function(state) {
  preferencesCache.uiState = state;
  chrome.storage.local.set({ [UI_STATE_KEY]: state }, function() {});
};

/**
 * Add storage functions for screenshot preference
 */
window.BlockBuddy.Storage.getScreenshotPreference = function() {
  return preferencesCache.screenshotEnabled;
};

window.BlockBuddy.Storage.setScreenshotPreference = function(value) {
  preferencesCache.screenshotEnabled = value;
  chrome.storage.local.set({ [SCREENSHOT_ENABLED_KEY]: value }, function() {});
};
