// API communication functions for Scratch AI Tutor

// Create a namespace for our API functions
window.ScratchAITutor = window.ScratchAITutor || {};
window.ScratchAITutor.API = window.ScratchAITutor.API || {};

/**
 * Send a question to the API
 * @param {string} question - The question to send
 * @param {string} projectId - The project ID
 * @param {Function} onThinking - Callback for thinking state
 * @param {Function} onResponse - Callback for response
 * @param {Function} onError - Callback for error
 */
window.ScratchAITutor.API.sendQuestionToAPI = function(question, projectId, onThinking, onResponse, onError) {
  // Start thinking indicator
  onThinking();
  
  // Get the project token if it exists
  const token = window.ScratchAITutor.Storage.getProjectToken(projectId);
  
  // Prepare the request data
  const requestData = {
    question: question,
    projectId: projectId
  };
  
  // Add token if available
  if (token) {
    requestData.token = token;
  }
  
  // Send the request to the background script
  chrome.runtime.sendMessage(
    {
      action: "sendQuestion",
      data: requestData
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError);
        onError("Error communicating with the server. Please try again.");
        return;
      }
      
      if (response.error) {
        console.error("API error:", response.error);
        onError(response.error || "Error communicating with the server. Please try again.");
        return;
      }
      
      // Save the token if provided
      if (response.token) {
        window.ScratchAITutor.Storage.setProjectToken(projectId, response.token);
      }
      
      // Process the response - now passing audio data if available
      onResponse(
        response.answer || "Sorry, I couldn't get an answer. Please try again.", 
        response.audio || null,
        response.audioFormat || 'mp3'
      );
    }
  );
};
