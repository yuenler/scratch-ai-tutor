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
    chatBodyEl,
    userInputEl,
    sendButtonEl,
    closeButtonEl,
    clearChatButtonEl,
    voiceRecordButtonEl
  } = window.BlockBuddy.UI.createUI();

  // Add the container to the document
  document.body.appendChild(container);

  // Check saved UI state or default to minimized
  const uiState = window.BlockBuddy.Storage.getUIState();
  
  if (uiState.minimized) {
    // If state is minimized or this is first run (defaults to minimized)
    panel.style.display = "none";
    minimizedButton.style.display = "flex";
    
    // Load or set default position for minimized button
    const position = window.BlockBuddy.Storage.getMinimizedButtonPosition();
    const snapEdges = position && position.snapEdges ? 
      position.snapEdges : 
      { horizontal: null, vertical: 'right' };

    // Position the button based on snap edges
    window.BlockBuddy.UI.snapElementToEdges(minimizedButton, snapEdges, 'minimized');
    
    // Apply the free-axis position if available
    if (position && position.position !== null) {
      if (snapEdges.horizontal === 'top' || snapEdges.horizontal === 'bottom') {
        minimizedButton.style.left = position.position + 'px';
      } else if (snapEdges.vertical === 'left' || snapEdges.vertical === 'right') {
        minimizedButton.style.top = position.position + 'px';
      }
    } else {
      // Default vertical position when not provided
      minimizedButton.style.bottom = "100px";
    }
    
    // Save position if it was default
    if (!position || !position.snapEdges) {
      // Get current position after applying defaults
      const rect = minimizedButton.getBoundingClientRect();
      let newPosition = {
        snapEdges: snapEdges,
        position: snapEdges.horizontal ? rect.left : rect.top
      };
      window.BlockBuddy.Storage.saveMinimizedButtonPosition(newPosition);
    }
  } else {
    // If state is maximized
    minimizedButton.style.display = "none";
    panel.style.display = "flex";
    
    // Load or set default position for panel
    const position = window.BlockBuddy.Storage.getPanelPosition();
    const snapEdges = position && position.snapEdges ? 
      position.snapEdges : 
      { horizontal: 'bottom', vertical: 'right' };
    
    window.BlockBuddy.UI.snapElementToEdges(panel, snapEdges, 'panel');
    
    // Save position if it was default
    if (!position || !position.snapEdges) {
      window.BlockBuddy.Storage.savePanelPosition({
        snapEdges: snapEdges
      });
    }
  }

  // Variable to store the recorder object
  let recorderObj = null;
  let isRecording = false;

  // Function to send a question
  function sendQuestion() {
    const question = userInputEl.value.trim();
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
    const projectId = window.BlockBuddy.Utils.getProjectId(window.location.href);
    if (!projectId) {
      window.BlockBuddy.UI.addMessage(chatBodyEl, shadow, "Sorry, I couldn't identify the project ID.", "assistant");
      return;
    }
    
    // Add user message to chat
    window.BlockBuddy.UI.addMessage(chatBodyEl, shadow, question, "user");
    
    // Add user message to chat history
    window.BlockBuddy.Storage.addMessageToHistory(projectId, question, "user");
    
    // Clear input
    userInputEl.value = "";
    
    // Show thinking indicator
    const thinkingIndicator = window.BlockBuddy.UI.showThinkingIndicator(chatBodyEl);
    
    // Send question to API
    window.BlockBuddy.API.sendQuestionToAPI(
      question,
      projectId,
      () => {}, // onThinking - already handled above
      (answer, audioData, audioFormat) => {
        // Remove thinking indicator
        thinkingIndicator.remove();
        
        // Add assistant message with audio if available
        window.BlockBuddy.UI.addMessage(
          chatBodyEl, 
          shadow, 
          answer, 
          "assistant", 
          audioData, 
          audioFormat,
          true // Always render scratchblocks immediately for new messages
        );
        
        // Add assistant response to chat history
        window.BlockBuddy.Storage.addMessageToHistory(projectId, answer, "assistant");
      },
      (error) => {
        // Remove thinking indicator
        thinkingIndicator.remove();
        // Add error message
        console.error("Error sending question to API:", error);
        if (error.includes("Failed to get token")) {
          window.BlockBuddy.UI.addMessage(chatBodyEl, shadow, `I can't access your project. Please check if your project is set to "Share" so it's publicly viewable.`, "assistant");
        } else {
          window.BlockBuddy.UI.addMessage(chatBodyEl, shadow, `Oops! Something didn't work right. Maybe try asking me again?`, "assistant");
        }
      }
    );
  }

  // Voice recording button click - Toggle recording
  voiceRecordButtonEl.addEventListener("click", async () => {
    if (!isRecording) {
      // Start recording
      try {
        console.log("Starting voice recording...");
        isRecording = true;
        voiceRecordButtonEl.classList.add("recording");
        
        // Start recording and get the recorder object
        recorderObj = await window.BlockBuddy.VoiceRecording.startRecording();
      } catch (error) {
        console.error("Error starting voice recording:", error);
        voiceRecordButtonEl.classList.remove("recording");
        isRecording = false;
        
        // Show error message
        window.BlockBuddy.UI.addMessage(
          chatBodyEl, 
          shadow, 
          "Sorry, I couldn't access your microphone. Please check your microphone permissions and try again.", 
          "assistant"
        );
      }
    } else {
      // Stop recording
      try {
        console.log("Stopping voice recording...");
        voiceRecordButtonEl.classList.remove("recording");
        isRecording = false;
        
        // First get the audio data before showing any UI indicators
        const audioBase64 = await window.BlockBuddy.VoiceRecording.stopRecording(recorderObj);
        
        // Only show thinking indicator if we successfully got audio data
        const thinkingIndicator = window.BlockBuddy.UI.showThinkingIndicator(chatBodyEl);
        thinkingIndicator.textContent = "Transcribing audio...";
        
        try {
          // Transcribe the audio
          const transcribedText = await window.BlockBuddy.VoiceRecording.transcribeAudio(audioBase64);
          
          // Remove thinking indicator
          thinkingIndicator.remove();
          
          if (transcribedText) {
            // Set the transcribed text to the input field
            userInputEl.value = transcribedText;
            
            // Auto-resize the input field
            userInputEl.style.height = "auto";
            userInputEl.style.height = Math.min(userInputEl.scrollHeight, 100) + "px";
            
            // Focus the input field
            userInputEl.focus();
          } else {
            // Show error message if transcription failed
            window.BlockBuddy.UI.addMessage(
              chatBodyEl, 
              shadow, 
              "Sorry, I couldn't transcribe your voice. Please try again or type your question.", 
              "assistant"
            );
          }
        } catch (transcriptionError) {
          // Handle transcription errors
          console.error("Error transcribing:", transcriptionError);
          thinkingIndicator.remove();
          
          window.BlockBuddy.UI.addMessage(
            chatBodyEl, 
            shadow, 
            "Sorry, there was an error transcribing your voice. Please try again or type your question.", 
            "assistant"
          );
        }
      } catch (recordingError) {
        // Handle recording errors - no thinking indicator needed here
        console.error("Error stopping voice recording:", recordingError);
        voiceRecordButtonEl.classList.remove("recording");
        isRecording = false;
        
        // Show error message
        window.BlockBuddy.UI.addMessage(
          chatBodyEl, 
          shadow, 
          "Sorry, there was an error processing your voice recording. Please try again or type your question.", 
          "assistant"
        );
      }
    }
  });

  // Send button click
  sendButtonEl.addEventListener("click", sendQuestion);

  // Allow sending via Enter while permitting Shift+Enter for new lines
  userInputEl.addEventListener("keydown", (e) => {
    // Always stop propagation of keyboard events to prevent Scratch IDE from capturing them
    e.stopPropagation();
    
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  });

  // Auto-resize textarea as user types
  userInputEl.addEventListener("input", () => {
    userInputEl.style.height = "auto";
    userInputEl.style.height = Math.min(userInputEl.scrollHeight, 100) + "px";
  });

  // Close button click
  closeButtonEl.addEventListener("click", () => window.BlockBuddy.UI.hidePanel(panel, minimizedButton));

  // The minimizedButton click functionality is now handled in ui.js with separate areas for
  // dragging and clicking to ensure proper separation of concerns
  
  // Clear chat button click
  clearChatButtonEl.addEventListener("click", () => {
    // Get the current project ID
    const currentProjectId = window.BlockBuddy.Utils.getProjectId(window.location.href);
    
    if (currentProjectId) {
      // Clear the chat history in storage
      window.BlockBuddy.Storage.clearChatHistory(currentProjectId);
      
      // Clear the chat UI
      chatBodyEl.innerHTML = '';
      
      console.log("Chat history cleared for project ID:", currentProjectId);
    }
  });

  // Load project tokens from storage and then initialize the UI
  window.BlockBuddy.Storage.loadProjectTokens().then(() => {
    console.log('Token loading complete, initializing UI');
    
    // Now check if we have an existing token for the current project
    const currentProjectId = window.BlockBuddy.Utils.getProjectId(window.location.href);
    if (currentProjectId && window.BlockBuddy.Storage.getProjectToken(currentProjectId)) {
      console.log(`Found existing token for project ${currentProjectId}`);
    }
    
    // Load previous chat history if available
    if (currentProjectId) {
      const previousChat = window.BlockBuddy.Storage.getChatHistory(currentProjectId);
      
      if (previousChat && previousChat.length > 0) {
        console.log(`Loading ${previousChat.length} previous chat messages`);
        
        // Create containers for all messages first
        const messageContainers = [];
        
        // Display previous messages in the UI
        previousChat.forEach(msg => {
          // Create the message in the UI but don't render scratchblocks yet
          const messageContent = window.BlockBuddy.UI.addMessage(
            chatBodyEl, 
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
              window.BlockBuddy.ScratchBlocks.renderScratchblocks(shadow, container);
            }, 200 * (index + 1)); // Stagger rendering with 200ms between each message
          });
        }
        
        // Scroll to the bottom of the chat
        chatBodyEl.scrollTop = chatBodyEl.scrollHeight;
      }
    }
  });
}
