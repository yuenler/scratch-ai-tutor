// Only show the extension if the URL includes "scratch.mit.edu/projects/"
if (!window.location.href.includes("scratch.mit.edu/projects/")) {
  console.log("Not a Scratch project page, exiting.");
} else {
  // First, load all preferences and tokens from storage
  window.BlockBuddy.Storage.loadProjectTokens().then(() => {
    console.log('Preferences and tokens loaded, initializing UI');
    
    // Create the UI after preferences are loaded
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

    // Get the saved UI state (now we have the actual stored value)
    const uiState = window.BlockBuddy.Storage.getUIState();
    
    // Ensure UI state is properly initialized
    if (uiState.minimized === undefined) {
      uiState.minimized = false; // Default to maximized
      window.BlockBuddy.Storage.saveUIState(uiState);
    }
    
    if (uiState.minimized) {
      // If state is minimized
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
          if (position.position < 0) {
            // If position is negative, snap to bottom (default)
            minimizedButton.style.top = '80%';
          } else {
            minimizedButton.style.top = position.position + 'px';
          }
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
      
      // Apply saved size if available
      if (position) {
        // If saved dimensions exceed screen size, use percentage-based fallbacks
        const maxWidth = window.innerWidth * 0.4;
        const maxHeight = window.innerHeight * 0.75;
        
        panel.style.width = (position.width > window.innerWidth) ? maxWidth + "px" : position.width + "px";
        panel.style.height = (position.height > window.innerHeight) ? maxHeight + "px" : position.height + "px";
      }
      
      // Save position if it was default
      if (!position || !position.snapEdges) {
        window.BlockBuddy.Storage.savePanelPosition({
          snapEdges: snapEdges,
          width: panel.offsetWidth,
          height: panel.offsetHeight
        });
      }
    }

    // Variable to store the recorder object
    let recorderObj = null;
    let isRecording = false;
    let recordingTimeout = null;

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
    async function processQuestion(question) {
      // Get project ID
      const projectId = window.BlockBuddy.Utils.getProjectId(window.location.href);
      if (!projectId) {
        window.BlockBuddy.UI.addMessage(chatBodyEl, shadow, "To use BlockBuddy, you need to login to your Scratch account and share your project.", "assistant");
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
      
      // Check if screenshot is enabled
      const screenshotEnabled = window.BlockBuddy.Storage.getScreenshotPreference();
      
      if (screenshotEnabled) {
      
        console.log("Getting extension UI elements:", panel, minimizedButton);
        
        // Store original visibility states
        const panelWasVisible = panel && window.getComputedStyle(panel).display !== 'none';
        const buttonWasVisible = minimizedButton && window.getComputedStyle(minimizedButton).display !== 'none';
        
        // Temporarily hide the extension UI
        if (panel) panel.style.display = 'none';
        if (minimizedButton) minimizedButton.style.display = 'none';
        
        // Short delay to ensure UI is hidden before capturing
        setTimeout(async () => {
          try {
            // Try to capture screenshot
            const screenshotData = await window.BlockBuddy.Screenshot.captureProjectScreen();
            
            // Restore the extension UI visibility
            if (panel && panelWasVisible) panel.style.display = '';
            if (minimizedButton && buttonWasVisible) minimizedButton.style.display = '';
            
            // Process the screenshot if available
            if (screenshotData) {
              // Extract base64 data from data URL if needed
              const processedScreenshot = window.BlockBuddy.Screenshot.processBase64Image(screenshotData);
              console.log("Screenshot captured successfully, sending with question");
              
              // Send the question with the screenshot
              sendQuestionWithData(question, projectId, thinkingIndicator, processedScreenshot);
            } else {
              console.log("Screenshot capture failed, sending question without screenshot");
              sendQuestionWithData(question, projectId, thinkingIndicator, null);
            }
          } catch (error) {
            // Ensure UI is restored even if there's an error
            if (panel && panelWasVisible) panel.style.display = '';
            if (minimizedButton && buttonWasVisible) minimizedButton.style.display = '';
            
            console.error("Error capturing screenshot:", error);
            sendQuestionWithData(question, projectId, thinkingIndicator, null);
          }
        }, 50); // Short delay to ensure UI is hidden
      } else {
        // Send without screenshot
        sendQuestionWithData(question, projectId, thinkingIndicator, null);
      }
    }
  
    // Helper function to send the question with or without screenshot data
    function sendQuestionWithData(question, projectId, thinkingIndicator, screenshotData) {
      let messageElement = null;
      let messageContent = null;
      let fullResponse = '';
      let hasScratchblocks = false;
      
      window.BlockBuddy.API.sendQuestionToAPI(
        question,
        projectId,
        () => {
          // Called when in thinking state (this is not triggered while streaming)
          console.log("AI is thinking...");
        },
        () => {
          // Called when streaming starts
          console.log("Stream started");
          
          // Create an empty message container but don't display it yet
          messageElement = document.createElement("div");
          messageElement.className = `message assistant-message`;
          // Hide it completely until we have content
          messageElement.style.display = "none"; 
          messageElement.style.opacity = "0";
          messageElement.style.transform = "translateY(20px)";
          
          const messageHeader = document.createElement("div");
          messageHeader.className = "message-header";
          
          const messageIcon = document.createElement("div");
          messageIcon.className = "message-icon";
          
          // Use BlockBuddy icon instead of emoji
          const iconImg = document.createElement("img");
          iconImg.src = chrome.runtime.getURL("images/icon32.png");
          iconImg.style.width = "24px";
          iconImg.style.height = "24px";
          iconImg.style.borderRadius = "50%";
          messageIcon.appendChild(iconImg);
          
          const messageTitle = document.createElement("div");
          messageTitle.className = "message-title";
          messageTitle.textContent = "BlockBuddy";
          
          messageHeader.appendChild(messageIcon);
          messageHeader.appendChild(messageTitle);
          
          messageContent = document.createElement("div");
          messageContent.className = "message-content";
          
          messageElement.appendChild(messageHeader);
          messageElement.appendChild(messageContent);
          
          chatBodyEl.appendChild(messageElement);
          
          // Don't animate the message in yet - we'll do that when we have content
        },
        (chunk) => {
          // Called for each streaming chunk
          if (!messageContent) return;
          
          // Append the chunk to the full response
          fullResponse += chunk;
          
          // Check if full response so far is empty or only whitespace/newlines
          const isEmpty = fullResponse.trim() === '';
          
          // Keep thinking indicator if message is still effectively empty
          if (isEmpty) {
            console.log("Message still empty, keeping thinking indicator visible");
            // Don't update UI yet, keep thinking indicator
            return;
          }
          
          // Only when we have actual content: remove thinking indicator and show message
          if (thinkingIndicator && !isEmpty) {
            console.log("Removing thinking indicator now that we have content");
            thinkingIndicator.remove();
            thinkingIndicator = null; // Prevent multiple removals
            
            // Now show and animate the message
            messageElement.style.display = ""; // Restore display
            setTimeout(() => {
              messageElement.style.opacity = "1";
              messageElement.style.transform = "translateY(0)";
              messageElement.style.transition = "opacity 0.4s ease, transform 0.4s ease";
            }, 10);
            
            // Scroll to bottom when showing the message
            chatBodyEl.scrollTop = chatBodyEl.scrollHeight;
          }
          
          // Check if content might contain scratchblocks
          if (!hasScratchblocks && chunk && chunk.includes("```scratchblocks")) {
            hasScratchblocks = true;
          }
          
          // Update the message content with markdown parsing
          messageContent.innerHTML = window.BlockBuddy.Markdown.parseMarkdown(fullResponse);
          
          // Scroll to bottom to follow the streaming content
          chatBodyEl.scrollTop = chatBodyEl.scrollHeight;
        },
        (completeResponse, projectToken) => {
          // Called when streaming is complete
          if (!messageContent || !messageElement) return;
          
          fullResponse = completeResponse;
          
          // Update with the final complete response
          messageContent.innerHTML = window.BlockBuddy.Markdown.parseMarkdown(fullResponse);
          
          console.log("Stream complete, waiting to render scratchblocks and generate TTS...");
          
          // Use setTimeout to ensure the DOM has updated before rendering scratchblocks
          setTimeout(() => {
            // If there are scratchblocks, render them now
            if (hasScratchblocks || fullResponse.includes("```scratchblocks")) {
              console.log("Rendering scratchblocks now that streaming is complete");
              window.BlockBuddy.ScratchBlocks.renderScratchblocks(shadow, messageContent);
            }
            
            // Generate a message ID for this assistant message
            const messageId = window.BlockBuddy.Storage.generateMessageId();
            
            // Store the message in chat history with the message ID
            window.BlockBuddy.Storage.addMessageToHistory(projectId, fullResponse, "assistant", messageId);
            
            // Generate TTS for the response if autoplay is enabled
            const autoplayEnabled = window.BlockBuddy.Storage.getAutoplayPreference();
            generateTTSForResponse(fullResponse, messageElement, messageId, autoplayEnabled);
            
            // Scroll to bottom one final time
            chatBodyEl.scrollTop = chatBodyEl.scrollHeight;
          }, 500); // Small delay to ensure DOM updates before processing
        },
        (error) => {
          // Remove thinking indicator
          thinkingIndicator.remove();
          // Add error message
          console.error("Error sending question to API:", error);
          if (error.includes("Failed to get token")) {
            window.BlockBuddy.UI.addMessage(
              chatBodyEl, 
              shadow, 
              `I can't access your project. Please check if your project is set to "Share" so it's publicly viewable.`, 
              "assistant"
            );
          } else {
            window.BlockBuddy.UI.addMessage(
              chatBodyEl, 
              shadow, 
              `Oops! Something didn't work right. Maybe try asking me again?`, 
              "assistant"
            );
          }
        },
        screenshotData // Pass the screenshot data
      );
    }
  
    // Function to generate TTS for a response
    function generateTTSForResponse(text, messageElement, messageId, autoplay = true) {
      const generateAudio = window.BlockBuddy.Storage.getGenerateAudioPreference();
      
      // If audio generation is disabled, simply return without doing anything
      if (!generateAudio) {
        console.log("Audio generation is disabled by user preference. Skipping TTS generation.");
        return;
      }
      
      console.log("Generating TTS for text:", text.substring(0, 100) + "...");
      
      // Remove scratchblocks code from TTS input to avoid reading code blocks
      const cleanedText = text.replace(/```scratchblocks[\s\S]*?```/g, "A code block has been provided. ");
      
      // Create a placeholder for the audio player with a loading indicator
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'audio-loading-indicator';
      loadingIndicator.style.display = 'flex';
      loadingIndicator.style.alignItems = 'center';
      loadingIndicator.style.marginTop = '10px';
      loadingIndicator.style.color = '#666';
      loadingIndicator.style.fontStyle = 'italic';
      loadingIndicator.textContent = 'Generating audio...';
      
      // Add a spinning animation
      const spinner = document.createElement('div');
      spinner.className = 'loading-spinner';
      spinner.style.width = '16px';
      spinner.style.height = '16px';
      spinner.style.border = '2px solid #ccc';
      spinner.style.borderTopColor = '#4c97ff';
      spinner.style.borderRadius = '50%';
      spinner.style.marginRight = '8px';
      spinner.style.animation = 'spin 1s linear infinite';
      
      // Add a style for the spinning animation to the shadow DOM
      const style = document.createElement('style');
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      shadow.appendChild(style);
      
      loadingIndicator.prepend(spinner);
      messageElement.appendChild(loadingIndicator);
      
      // Check if we already have audio for this message
      const projectId = window.location.href.match(/\/projects\/(\d+)/)?.[1];
      const existingAudio = messageId ? window.BlockBuddy.Storage.getMessageAudio(messageId) : null;
      
      if (existingAudio && existingAudio.audioData) {
        console.log("Found existing audio for message, using from localStorage");
        
        // Remove loading indicator
        if (loadingIndicator && loadingIndicator.parentNode) {
          loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
        
        if (messageElement) {
          const audioPlayer = window.BlockBuddy.UI.createAudioPlayer(
            existingAudio.audioData, 
            existingAudio.audioFormat, 
            autoplay
          );
          messageElement.appendChild(audioPlayer.container);
        }
        return;
      }
      
      // Generate TTS
      window.BlockBuddy.API.generateTTS(
        cleanedText,
        (audioData, audioFormat) => {
          console.log("TTS generated successfully");
          
          // Remove loading indicator
          if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.parentNode.removeChild(loadingIndicator);
          }
          
          if (messageElement) {
            const audioPlayer = window.BlockBuddy.UI.createAudioPlayer(
              audioData, 
              audioFormat, 
              autoplay
            );
            messageElement.appendChild(audioPlayer.container);
            
            // Save audio data to localStorage if we have a message ID
            if (messageId) {
              window.BlockBuddy.Storage.saveMessageAudio(messageId, {
                audioData: audioData,
                audioFormat: audioFormat,
                timestamp: Date.now(),
                projectId: projectId || 'unknown'
              });
            }
          }
        },
        (error) => {
          console.error("Error generating TTS:", error);
          
          // Remove loading indicator and show error
          if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.textContent = 'Failed to generate audio';
            loadingIndicator.style.color = '#e74c3c';
            // Remove spinner
            if (spinner && spinner.parentNode) {
              spinner.parentNode.removeChild(spinner);
            }
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
          
          // Set a timeout to automatically stop recording after 20 seconds
          const MAX_RECORDING_TIME = 20000; // 20 seconds in milliseconds
          recordingTimeout = setTimeout(async () => {
            if (isRecording) {
              console.log("Recording reached maximum time limit of 20 seconds, stopping automatically.");
              voiceRecordButtonEl.classList.remove("recording");
              isRecording = false;
              
              try {
                // Get the audio data
                const audioBase64 = await window.BlockBuddy.VoiceRecording.stopRecording(recorderObj);
                
                // Show thinking indicator
                const thinkingIndicator = window.BlockBuddy.UI.showThinkingIndicator(chatBodyEl);
                thinkingIndicator.textContent = "Transcribing audio...";
                
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
                }
              } catch (error) {
                console.error("Error processing auto-stopped recording:", error);
              }
            }
          }, MAX_RECORDING_TIME);
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
          
          // Clear the timeout if manual stop
          if (recordingTimeout) {
            clearTimeout(recordingTimeout);
            recordingTimeout = null;
          }
          
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
        
        // Clear all audio data for this project
        const allProjectAudio = window.BlockBuddy.Storage.getAllMessageAudio(currentProjectId);
        for (const messageId in allProjectAudio) {
          window.BlockBuddy.Storage.removeMessageAudio(messageId);
        }
        
        // Clear the chat UI
        chatBodyEl.innerHTML = '';
        
        console.log("Chat history and audio data cleared for project ID:", currentProjectId);
      }
    });

    // Load previous chat history if available
    const currentProjectId = window.BlockBuddy.Utils.getProjectId(window.location.href);
    if (currentProjectId) {
      const previousChat = window.BlockBuddy.Storage.getChatHistory(currentProjectId);
      
      if (previousChat && previousChat.length > 0) {
        console.log(`Loading ${previousChat.length} previous chat messages`);
        
        // Create containers for all messages first
        const messageContainers = [];
        
        // Display previous messages in the UI
        previousChat.forEach((msg, index) => {
          // Generate a consistent messageId based on content and timestamp if available
          const messageId = msg.messageId || 
                           (msg.role === 'assistant' ? 
                            `history_${currentProjectId}_${index}_${msg.timestamp || Date.now()}` : 
                            null);
                            
          // Create the message in the UI but don't render scratchblocks yet
          const messageContent = window.BlockBuddy.UI.addMessage(
            chatBodyEl, 
            shadow, 
            msg.content, 
            msg.role,
            null,  // No audio data - will be retrieved from storage via messageId if available
            null,  // No audio format - will be retrieved from storage via messageId if available
            messageId,  // Pass messageId to allow audio lookup
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
