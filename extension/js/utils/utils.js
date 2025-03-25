// Utility functions for BlockBuddy

// Create a namespace for our utilities
window.BlockBuddy = window.BlockBuddy || {};
window.BlockBuddy.Utils = window.BlockBuddy.Utils || {};

/**
 * Extract project ID from URL
 * @param {string} url - The URL to extract the project ID from
 * @returns {string|null} The project ID or null if not found
 */
window.BlockBuddy.Utils.getProjectId = function(url) {
  const match = url.match(/scratch\.mit\.edu\/projects\/(\d+)/);
  return match ? match[1] : null;
};

/**
 * Helper function to escape HTML special characters
 * @param {string} text - The text to escape
 * @returns {string} The escaped text
 */
window.BlockBuddy.Utils.escapeHtml = function(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Helper function to unescape HTML entities
 * @param {string} text - The text to unescape
 * @returns {string} The unescaped text
 */
window.BlockBuddy.Utils.unescapeHtml = function(text) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&");
};
