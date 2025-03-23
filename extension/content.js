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
    closeButton 
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
    // Add user message to chat
    window.ScratchAITutor.UI.addMessage(chatBody, shadow, question, "user");
    
    // Clear input
    userInput.value = "";
    
    // Get project ID
    const projectId = window.ScratchAITutor.Utils.getProjectId(window.location.href);
    if (!projectId) {
      window.ScratchAITutor.UI.addMessage(chatBody, shadow, "Sorry, I couldn't identify the project ID.", "assistant");
      return;
    }
    
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
        window.ScratchAITutor.UI.addMessage(chatBody, shadow, answer, "assistant", audioData, audioFormat);
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

  // Load project tokens from storage and then initialize the UI
  window.ScratchAITutor.Storage.loadProjectTokens().then(() => {
    console.log('Token loading complete, initializing UI');
    
    // Now check if we have an existing token for the current project
    const currentProjectId = window.ScratchAITutor.Utils.getProjectId(window.location.href);
    if (currentProjectId && window.ScratchAITutor.Storage.getProjectToken(currentProjectId)) {
      console.log(`Found existing token for project ${currentProjectId}`);
    }
    
    // Show the panel
    window.ScratchAITutor.UI.showPanel(panel, minimizedButton);
  });
}
