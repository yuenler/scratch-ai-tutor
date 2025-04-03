// Screenshot utility for BlockBuddy
window.BlockBuddy = window.BlockBuddy || {};
window.BlockBuddy.Screenshot = window.BlockBuddy.Screenshot || {};

/**
 * Capture a screenshot of the entire screen
 * @returns {Promise<string|null>} Base64 encoded screenshot or null if capture fails
 */
window.BlockBuddy.Screenshot.captureProjectScreen = async function() {
  try {
    console.log("Attempting to capture full screen screenshot...");
    
    // Use chrome.tabs.captureVisibleTab to capture the full visible tab
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "captureScreen"
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error capturing screen:", chrome.runtime.lastError);
            resolve(null);
            return;
          }
          
          if (!response || !response.screenshot) {
            console.error("Failed to capture screenshot", response);
            resolve(null);
            return;
          }
          
          // Success - return the base64 image data
          console.log("Screenshot captured successfully!");
          resolve(response.screenshot);
        }
      );
    });
  } catch (error) {
    console.error("Error capturing screenshot:", error);
    return null;
  }
};

/**
 * Process a base64 image to ensure it's in the correct format for the API
 * @param {string} base64Image - The base64 image string
 * @returns {string} Correctly formatted base64 string without the data URL prefix
 */
window.BlockBuddy.Screenshot.processBase64Image = function(base64Image) {
  if (!base64Image) return null;
  
  // Remove the data URL prefix if present
  if (base64Image.startsWith('data:')) {
    const parts = base64Image.split(',');
    if (parts.length === 2) {
      return parts[1];
    }
  }
  
  return base64Image;
};
