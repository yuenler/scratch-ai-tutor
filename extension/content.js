// Only show the extension if the URL includes "scratch.mit.edu/projects/"
if (!window.location.href.includes("scratch.mit.edu/projects/")) {
  console.log("Not a Scratch project page, exiting.");
} else {
  // Create the UI
  const { 
    container, 
    shadow, 
    panel, 
    minimizedButton, 
    chatBody, 
    userInput, 
    sendButton, 
    closeButton,
    clearChatButton
  } = window.ScratchAITutor.UI.createUI();

  // Add the container to the document
  document.body.appendChild(container);

  // Function to send a question
  function sendQuestion() {
    const question = userInput.value.trim();
    if (!question) return;
    
    // Try to autosave the project first
    const saveButton = document.querySelector('div.save-status_save-now_c2ybV');
    if (saveButton) {
      console.log("Found save button, clicking to autosave project");
      saveButton.click();
      // Small delay to allow save to begin
      setTimeout(() => {
        processQuestion(question);
      }, 300);
    } else {
      // No save button found, proceed normally
      processQuestion(question);
    }
  }
  
  // Function to process the question after attempting to save
  function processQuestion(question) {
    // Get project ID
    const projectId = window.ScratchAITutor.Utils.getProjectId(window.location.href);
    if (!projectId) {
      window.ScratchAITutor.UI.addMessage(chatBody, shadow, "Sorry, I couldn't identify the project ID.", "assistant");
      return;
    }
    
    // Add user message to chat
    window.ScratchAITutor.UI.addMessage(chatBody, shadow, question, "user");
    
    // Add user message to chat history
    window.ScratchAITutor.Storage.addMessageToHistory(projectId, question, "user");
    
    // Clear input
    userInput.value = "";
    
    // Show thinking indicator
    const thinkingIndicator = window.ScratchAITutor.UI.showThinkingIndicator(chatBody);
    
    // Send question to API
    window.ScratchAITutor.API.sendQuestionToAPI(
      question,
      projectId,
      () => {}, // onThinking - already handled above
      (answer, audioData, audioFormat) => {
        // Remove thinking indicator
        thinkingIndicator.remove();
        
        // Add assistant message with audio if available
        window.ScratchAITutor.UI.addMessage(
          chatBody, 
          shadow, 
          answer, 
          "assistant", 
          audioData, 
          audioFormat,
          true // Always render scratchblocks immediately for new messages
        );
        
        // Add assistant response to chat history
        window.ScratchAITutor.Storage.addMessageToHistory(projectId, answer, "assistant");
      },
      (error) => {
        // Remove thinking indicator
        thinkingIndicator.remove();
        // Add error message
        console.error("Error sending question to API:", error);
        if (error.includes("Failed to get token")) {
          window.ScratchAITutor.UI.addMessage(chatBody, shadow, `I can't access your project. Please check if your project is set to "Share" so it's publicly viewable.`, "assistant");
        } else {
          window.ScratchAITutor.UI.addMessage(chatBody, shadow, `Oops! Something didn't work right. Maybe try asking me again?`, "assistant");
        }
      }
    );
  }

  // Send button click
  sendButton.addEventListener("click", sendQuestion);

  // Allow sending via Enter while permitting Shift+Enter for new lines
  userInput.addEventListener("keydown", (e) => {
    // Always stop propagation of keyboard events to prevent Scratch IDE from capturing them
    e.stopPropagation();
    
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  });

  // Auto-resize textarea as user types
  userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 100) + "px";
  });

  // Close button click
  closeButton.addEventListener("click", () => window.ScratchAITutor.UI.hidePanel(panel, minimizedButton));

  // Clicking the minimized button reopens the panel
  minimizedButton.addEventListener("click", () => window.ScratchAITutor.UI.showPanel(panel, minimizedButton));

  // Clear chat button click
  clearChatButton.addEventListener("click", () => {
    // Get the current project ID
    const currentProjectId = window.ScratchAITutor.Utils.getProjectId(window.location.href);
    
    if (currentProjectId) {
      // Clear the chat history in storage
      window.ScratchAITutor.Storage.clearChatHistory(currentProjectId);
      
      // Clear the chat UI
      chatBody.innerHTML = '';
      
      // Add a system message to confirm clearing
      window.ScratchAITutor.UI.addMessage(
        chatBody, 
        shadow, 
        "Chat history has been cleared.", 
        "assistant"
      );
      
      console.log("Chat history cleared for project ID:", currentProjectId);
    }
  });

  // Load project tokens from storage and then initialize the UI
  window.ScratchAITutor.Storage.loadProjectTokens().then(() => {
    console.log('Token loading complete, initializing UI');
    
    // Now check if we have an existing token for the current project
    const currentProjectId = window.ScratchAITutor.Utils.getProjectId(window.location.href);
    if (currentProjectId && window.ScratchAITutor.Storage.getProjectToken(currentProjectId)) {
      console.log(`Found existing token for project ${currentProjectId}`);
    }
    
    // Load previous chat history if available
    if (currentProjectId) {
      const previousChat = window.ScratchAITutor.Storage.getChatHistory(currentProjectId);
      
      if (previousChat && previousChat.length > 0) {
        console.log(`Loading ${previousChat.length} previous chat messages`);
        
        // Create containers for all messages first
        const messageContainers = [];
        
        // Display previous messages in the UI
        previousChat.forEach(msg => {
          // Create the message in the UI but don't render scratchblocks yet
          const messageContent = window.ScratchAITutor.UI.addMessage(
            chatBody, 
            shadow, 
            msg.content, 
            msg.role,
            null,  // No audio data for history messages
            null,  // No audio format for history messages
            false  // Don't render scratchblocks yet for history messages
          );
          
          // Store the message content element if it's an assistant message with scratchblocks
          if (msg.role === "assistant" && msg.content.includes("```scratchblocks")) {
            messageContainers.push(messageContent);
          }
        });
        
        // Render scratchblocks individually for each message with a delay between them
        if (messageContainers.length > 0) {
          console.log(`Found ${messageContainers.length} messages with scratchblocks to render`);
          
          // Render each container separately with a short delay between
          messageContainers.forEach((container, index) => {
            setTimeout(() => {
              console.log(`Rendering scratchblocks for history message ${index + 1}`);
              window.ScratchAITutor.ScratchBlocks.renderScratchblocks(shadow, container);
            }, 200 * (index + 1)); // Stagger rendering with 200ms between each message
          });
        }
        
        // Scroll to the bottom of the chat
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    }
    
    // Show the panel
    window.ScratchAITutor.UI.showPanel(panel, minimizedButton);
  });
}
