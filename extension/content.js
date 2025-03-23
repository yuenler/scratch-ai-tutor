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
        window.ScratchAITutor.UI.addMessage(chatBody, shadow, `Error: ${error}`, "assistant");
      }
    );
  }

  // Send button click
  sendButton.addEventListener("click", sendQuestion);

  // Allow sending via Enter while permitting Shift+Enter for new lines
  userInput.addEventListener("keydown", (e) => {
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

  // The small X inside the minimized button removes the entire extension
  const minimizedClose = minimizedButton.querySelector(".minimized-close");
  minimizedClose.addEventListener("click", (e) => {
    e.stopPropagation(); // Don't reopen the panel
    container.remove();  // remove the entire extension from the DOM
  });

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
