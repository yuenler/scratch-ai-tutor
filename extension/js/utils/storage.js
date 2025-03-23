// Storage utility functions for Block Buddy

// Create a namespace for our storage utilities
window.ScratchAITutor = window.ScratchAITutor || {};
window.ScratchAITutor.Storage = window.ScratchAITutor.Storage || {};

// Storage key for project tokens
const PROJECT_TOKENS_KEY = 'scratchAITutor_projectTokens';
const CHAT_HISTORY_KEY = 'scratchAITutor_chatHistory';

// Store project tokens for reuse
let projectTokens = {};
let chatHistory = {};

/**
 * Load saved tokens from storage
 * @returns {Promise} Promise that resolves when tokens are loaded
 */
window.ScratchAITutor.Storage.loadProjectTokens = function() {
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
window.ScratchAITutor.Storage.saveProjectTokens = function() {
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
window.ScratchAITutor.Storage.saveChatHistory = function() {
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
window.ScratchAITutor.Storage.getProjectToken = function(projectId) {
  return projectTokens[projectId] || null;
};

/**
 * Set a project token
 * @param {string} projectId - The project ID
 * @param {string} token - The project token
 */
window.ScratchAITutor.Storage.setProjectToken = function(projectId, token) {
  projectTokens[projectId] = token;
  window.ScratchAITutor.Storage.saveProjectTokens();
};

/**
 * Get all project tokens
 * @returns {Object} All project tokens
 */
window.ScratchAITutor.Storage.getAllProjectTokens = function() {
  return projectTokens;
};

/**
 * Get chat history for a project
 * @param {string} projectId - The project ID
 * @returns {Array} The chat history for the project or empty array if not found
 */
window.ScratchAITutor.Storage.getChatHistory = function(projectId) {
  return chatHistory[projectId] || [];
};

/**
 * Add a message to the chat history
 * @param {string} projectId - The project ID
 * @param {string} message - The message text
 * @param {string} role - The role (user or assistant)
 */
window.ScratchAITutor.Storage.addMessageToHistory = function(projectId, message, role) {
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
  window.ScratchAITutor.Storage.saveChatHistory();
};

/**
 * Clear chat history for a project
 * @param {string} projectId - The project ID
 */
window.ScratchAITutor.Storage.clearChatHistory = function(projectId) {
  if (chatHistory[projectId]) {
    delete chatHistory[projectId];
    window.ScratchAITutor.Storage.saveChatHistory();
  }
};
