// API communication functions for BlockBuddy

// Create a namespace for our API functions
window.BlockBuddy = window.BlockBuddy || {};
window.BlockBuddy.API = window.BlockBuddy.API || {};

/**
 * Send a question to the API
 * @param {string} question - The question to send
 * @param {string} projectId - The project ID
 * @param {Function} onThinking - Callback for thinking state
 * @param {Function} onStreamStart - Callback for when streaming starts
 * @param {Function} onStreamChunk - Callback for each streamed chunk
 * @param {Function} onStreamComplete - Callback for when streaming completes
 * @param {Function} onError - Callback for error
 * @param {string|null} screenshotData - Optional base64 screenshot data
 */
window.BlockBuddy.API.sendQuestionToAPI = function(
  question, 
  projectId, 
  onThinking, 
  onStreamStart, 
  onStreamChunk, 
  onStreamComplete, 
  onError, 
  screenshotData
) {
  // Start thinking indicator
  onThinking();
  
  // Get the project token if it exists
  const token = window.BlockBuddy.Storage.getProjectToken(projectId);
  
  // Get model preference (true = thinking model, false = non-thinking model)
  const useThinkingModel = window.BlockBuddy.Storage.getModelPreference();
  console.log(`Using model: ${useThinkingModel ? 'thinking (o4-mini)' : 'non-thinking (gpt-4.1)'}`);
  
  // Prepare the request data
  const requestData = {
    question: question,
    projectId: projectId,
    useThinkingModel: useThinkingModel
  };
  
  // Add token if available
  if (token) {
    requestData.projectToken = token;
  }
  
  // Add screenshot if available
  if (screenshotData) {
    requestData.screenshot = screenshotData;
    console.log("Including screenshot with request");
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

  // Set up listeners for streaming response
  const setupStreamListeners = () => {
    // Listen for stream chunks
    chrome.runtime.onMessage.addListener(function streamListener(message) {
      if (message.action === "streamStart") {
        // Called when streaming starts
        onStreamStart();
        return;
      }
      
      if (message.action === "streamChunk") {
        // Process stream chunk
        onStreamChunk(message.chunk);
        return;
      }
      
      if (message.action === "streamComplete") {
        // Process stream completion
        chrome.runtime.onMessage.removeListener(streamListener);
        onStreamComplete(message.fullResponse, message.projectToken);
        
        // Store the project token
        if (message.projectToken) {
          window.BlockBuddy.Storage.setProjectToken(projectId, message.projectToken);
        }
        
        return;
      }
      
      if (message.action === "streamError") {
        // Handle error
        chrome.runtime.onMessage.removeListener(streamListener);
        onError(message.error);
        return;
      }
    });
  };

  // Send message to background script to start the API request
  setupStreamListeners();
  
  // Send the request to the background script
  chrome.runtime.sendMessage({
    action: "sendQuestionToAPI",
    data: requestData
  });
};

/**
 * Generate text-to-speech audio for a text response
 * @param {string} text - The text to convert to speech
 * @param {Function} onSuccess - Callback for success
 * @param {Function} onError - Callback for error
 */
window.BlockBuddy.API.generateTTS = function(text, onSuccess, onError) {
  console.log("Generating TTS for text:", text.substring(0, 100) + (text.length > 100 ? "..." : ""));
  
  // Clean up the text by removing scratchblocks code
  const cleanedText = text.replace(/```scratchblocks[\s\S]*?```/g, "");
  
  // Send the request to the background script
  chrome.runtime.sendMessage(
    {
      action: "generateTTS",
      text: cleanedText
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending TTS message:", chrome.runtime.lastError);
        onError("Error generating speech. Please try again.");
        return;
      }
      
      if (response.error) {
        console.error("TTS API error:", response.error);
        onError(response.error || "Error generating speech. Please try again.");
        return;
      }
      
      // Process the response
      onSuccess(response.audio, response.audioFormat || 'mp3');
    }
  );
};
