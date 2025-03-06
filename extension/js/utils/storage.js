// Storage utility functions for Scratch AI Tutor

// Create a namespace for our storage utilities
window.ScratchAITutor = window.ScratchAITutor || {};
window.ScratchAITutor.Storage = window.ScratchAITutor.Storage || {};

// Store project tokens for reuse
let projectTokens = {};

/**
 * Load saved tokens from storage
 * @returns {Promise} Promise that resolves when tokens are loaded
 */
window.ScratchAITutor.Storage.loadProjectTokens = function() {
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
};

/**
 * Save tokens to storage
 */
window.ScratchAITutor.Storage.saveProjectTokens = function() {
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
