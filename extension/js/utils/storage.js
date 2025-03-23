// Storage utility functions for Scratch AI Tutor

// Create a namespace for our storage utilities
window.ScratchAITutor = window.ScratchAITutor || {};
window.ScratchAITutor.Storage = window.ScratchAITutor.Storage || {};

// Storage key for project tokens
const PROJECT_TOKENS_KEY = 'scratchAITutor_projectTokens';

// Store project tokens for reuse
let projectTokens = {};

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
