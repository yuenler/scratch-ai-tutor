// API communication functions for BlockBuddy

// Create a namespace for our API functions
window.BlockBuddy = window.BlockBuddy || {};
window.BlockBuddy.API = window.BlockBuddy.API || {};

/**
 * Send a question to the API
 * @param {string} question - The question to send
 * @param {string} projectId - The project ID
 * @param {Function} onThinking - Callback for thinking state
 * @param {Function} onResponse - Callback for response
 * @param {Function} onError - Callback for error
 */
window.BlockBuddy.API.sendQuestionToAPI = function(question, projectId, onThinking, onResponse, onError) {
  // Start thinking indicator
  onThinking();
  
  // Get the project token if it exists
  const token = window.BlockBuddy.Storage.getProjectToken(projectId);
  
  // Prepare the request data
  const requestData = {
    question: question,
    projectId: projectId
  };
  
  // Add token if available
  if (token) {
    requestData.projectToken = token;
  }
  
  // Add chat history for context
  const chatHistory = window.BlockBuddy.Storage.getChatHistory(projectId);
  if (chatHistory && chatHistory.length > 0) {
    requestData.chatHistory = chatHistory;
    
    // Debug: Log chat history being sent to backend
    // console.log("Sending chat history to backend:", JSON.stringify(chatHistory, null, 2));
  } else {
    console.log("No chat history available to send for project ID:", projectId);
  }

  console.log("Sending request to background script:", requestData);

  
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
      if (response.projectToken) {
        window.BlockBuddy.Storage.setProjectToken(projectId, response.projectToken);
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
