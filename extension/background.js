// Background script for BlockBuddy

// Function to render scratchblocks in the page context
function renderScratchblocksInPage(blockData) {
  console.log("Rendering scratchblocks in page context:", blockData);
  
  try {
    // Check if scratchblocks is available
    if (typeof scratchblocks === 'undefined' || !window.scratchblocksLoaded) {
      console.error("scratchblocks not available in page context or not fully loaded");
      
      // Print debug info about what's loaded
      console.log("Debug info:", {
        scratchblocksExists: typeof scratchblocks !== 'undefined',
        loaderFlagExists: typeof window.scratchblocksLoaded !== 'undefined',
        loaderFlag: window.scratchblocksLoaded,
        windowKeys: Object.keys(window).filter(k => k.includes('scratch')),
        documentScripts: Array.from(document.scripts).map(s => s.src)
      });
      
      return { success: false, error: "scratchblocks not available - please try again after libraries are loaded" };
    }
    
    // Get the container element
    const container = document.getElementById(blockData.containerId);
    if (!container) {
      console.error("Container not found:", blockData.containerId);
      return { success: false, error: "container not found" };
    }
    
    console.log("About to render with scratchblocks.render()", blockData.code);
    
    // Render the block
    const svg = scratchblocks.render(blockData.code, {
      style: 'scratch3',
      languages: ['en']
    });
    
    // Log information about the SVG
    console.log("Generated SVG:", {
      nodeName: svg.nodeName,
      childNodes: svg.childNodes.length,
      outerHTML: svg.outerHTML.substring(0, 200) + '...' // Log the first 200 chars to avoid huge logs
    });
    
    // Clear the container and append the SVG
    container.innerHTML = '';
    container.appendChild(svg);
    container.dataset.rendered = 'true';
    
    console.log("Successfully rendered block:", blockData.containerId);
    console.log("Container HTML after rendering:", container.innerHTML.substring(0, 200) + '...');
    
    return { success: true };
  } catch (e) {
    console.error("Error rendering block:", e);
    return { success: false, error: e.message };
  }
}

// Function to load scratchblocks libraries in the page context
function loadScratchblocksLibraries(urls) {
  console.log("Loading scratchblocks libraries in page context:", urls);
  
  return new Promise((resolve) => {
    // Check if already loaded
    if (typeof scratchblocks !== 'undefined') {
      console.log("Scratchblocks already loaded in page context");
      resolve({ success: true });
      return;
    }
    
    // Define a global flag to track when libraries are fully loaded
    window.scratchblocksLoaded = false;
    
    console.log("Creating script elements for loading libraries");
    
    // Load the main library
    const script1 = document.createElement('script');
    script1.src = urls.scratchblocksUrl;
    script1.type = 'text/javascript';
    
    script1.onload = function() {
      console.log("Scratchblocks library loaded in page context, now loading translations");
      
      // Load translations after main library is loaded
      const script2 = document.createElement('script');
      script2.src = urls.translationsUrl;
      script2.type = 'text/javascript';
      
      script2.onload = function() {
        console.log("Scratchblocks translations loaded in page context");
        
        // Verify that scratchblocks is available
        if (typeof scratchblocks === 'undefined') {
          console.error("scratchblocks still not available after loading libraries");
          resolve({ success: false, error: "Failed to initialize scratchblocks" });
          return;
        }
        
        console.log("scratchblocks is available and ready to use!");
        window.scratchblocksLoaded = true;
        resolve({ success: true });
      };
      
      script2.onerror = function(e) {
        console.error("Error loading translations:", e);
        resolve({ success: false, error: "Failed to load translations" });
      };
      
      document.head.appendChild(script2);
    };
    
    script1.onerror = function(e) {
      console.error("Error loading scratchblocks:", e);
      resolve({ success: false, error: "Failed to load scratchblocks" });
    };
    
    document.head.appendChild(script1);
  });
}

// Function to send a question to the backend API
async function sendQuestionToBackend(data) {
  console.log("Sending question to backend API:", data);
  
  try {
    // API endpoint URL 
    const apiUrl = "https://scratch-ai-tutor.vercel.app/api/chat-response";
    
    // Create a fetch request to the API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    
    // Check if the response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error:", response.status, errorText);
      throw new Error(`Server error (${response.status}): ${errorText || "Unknown error"}`);
    }
    
    // Return a function that takes a callback to handle the streaming data
    return {
      processStream: async function(onChunk) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        try {
          while (true) {
            const { value, done } = await reader.read();
            
            if (done) {
              // Process any remaining data in the buffer
              if (buffer.length > 0) {
                processBufferChunks(buffer, onChunk);
              }
              break;
            }
            
            // Decode and add to buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete messages
            const messages = buffer.split('\n\n');
            buffer = messages.pop() || ''; // Keep the last incomplete chunk
            
            // Process each complete message
            for (const message of messages) {
              processMessage(message, onChunk);
            }
          }
        } catch (error) {
          console.error("Error reading stream:", error);
          throw error;
        } finally {
          reader.releaseLock();
        }
      }
    };
  } catch (error) {
    console.error("Error sending question to API:", error);
    throw error;
  }
}

// Helper function to process a message
function processMessage(message, callback) {
  if (message.startsWith('data: ')) {
    try {
      const data = JSON.parse(message.slice(6));
      if (data) {
        callback(data);
      }
    } catch (e) {
      console.error('Error parsing streaming data:', e, message);
    }
  }
}

// Helper function to process buffer chunks
function processBufferChunks(buffer, callback) {
  const chunks = buffer.split('\n\n');
  for (const chunk of chunks) {
    processMessage(chunk, callback);
  }
}

// Function to send text for TTS conversion
async function sendTextToTTS(text) {
  console.log("Sending text for TTS conversion:", text.substring(0, 100) + (text.length > 100 ? "..." : ""));
  
  try {
    // API endpoint URL
    const apiUrl = "https://scratch-ai-tutor.vercel.app/api/tts";
    
    console.log("Sending TTS request to:", apiUrl);
    
    // Send the request
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });
    
    // Check if the response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error("TTS API error:", response.status, errorText);
      return { 
        error: `Server error (${response.status}): ${errorText || "Unknown error"}` 
      };
    }
    
    // Parse the response
    const result = await response.json();
    console.log("TTS API response received, audio data length:", result.audio ? result.audio.length : 0);
    
    if (!result.audio) {
      console.error("TTS API returned no audio data");
      return { error: "No audio data received from TTS API" };
    }
    
    return result;
  } catch (error) {
    console.error("Error sending text to TTS API:", error);
    return { error: error.message || "Error generating speech" };
  }
}

// Function to send audio data for transcription
async function transcribeAudioToBackend(data) {
  console.log("Sending audio data for transcription to backend API");
  
  try {
    // API endpoint URL
    const apiUrl = "https://scratch-ai-tutor.vercel.app/api/transcribe";
    
    // Send the request
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    
    // Check if the response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error:", response.status, errorText);
      return { 
        error: `Server error (${response.status}): ${errorText || "Unknown error"}` 
      };
    }
    
    // Parse the response
    const result = await response.json();
    console.log("Transcription API response:", result);
    
    return result;
  } catch (error) {
    console.error("Error sending audio for transcription:", error);
    return { 
      error: `Network error: ${error.message}` 
    };
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background script received message:", message.action);
  
  // Handle the message based on its action
  if (message.action === "executeScript") {
    // Execute the script in the tab that sent the message
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: message.func,
      args: message.args || []
    })
    .then(results => {
      sendResponse({ success: true, results });
    })
    .catch(error => {
      console.error("Error executing script:", error);
      sendResponse({ success: false, error: error.message });
    });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  if (message.action === "captureScreen") {
    // Capture the visible tab
    chrome.tabs.captureVisibleTab(
      sender.tab.windowId,
      { format: 'jpeg', quality: 70 },
      dataUrl => {
        if (chrome.runtime.lastError) {
          console.error("Error capturing screen:", chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        
        console.log("Screen captured successfully");
        sendResponse({ success: true, screenshot: dataUrl });
      }
    );
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  if (message.action === "renderScratchblocks") {
    // Execute the rendering function in the tab that sent the message
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: renderScratchblocksInPage,
      args: [message.blockData]
    })
    .then(results => {
      sendResponse(results[0].result);
    })
    .catch(error => {
      console.error("Error executing script:", error);
      sendResponse({ success: false, error: error.message });
    });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  if (message.action === "loadScratchblocksLibraries") {
    // Execute the loading function in the tab that sent the message
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: loadScratchblocksLibraries,
      args: [message.urls]
    })
    .then(results => {
      sendResponse(results[0].result);
    })
    .catch(error => {
      console.error("Error executing script:", error);
      sendResponse({ success: false, error: error.message });
    });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  if (message.action === "sendQuestionToAPI") {
    // Handle the request to send a question to the backend API
    (async () => {
      try {
        // Send the request to the backend
        const streamSource = await sendQuestionToBackend(message.data);
        
        // Get the tab ID where the content script is running
        const tabId = sender.tab.id;
        
        // Send "streaming started" message to content script
        chrome.tabs.sendMessage(tabId, { action: "streamStart" });
        
        // Process the stream
        await streamSource.processStream((data) => {
          if (data.error) {
            // Send error message to the content script
            chrome.tabs.sendMessage(tabId, { 
              action: "streamError", 
              error: data.error 
            });
          } else if (data.done) {
            // Stream is complete, send full response
            const { fullResponse, projectToken } = data;
            
            // Send complete message to the content script
            chrome.tabs.sendMessage(tabId, { 
              action: "streamComplete", 
              fullResponse,
              projectToken
            });
          } else {
            // Send chunk to the content script
            chrome.tabs.sendMessage(tabId, { 
              action: "streamChunk", 
              chunk: data.chunk 
            });
          }
        });
      } catch (error) {
        console.error("Error in streaming:", error);
        
        // Send error to the content script
        chrome.tabs.sendMessage(sender.tab.id, { 
          action: "streamError", 
          error: error.message || "Error communicating with the server. Please try again."
        });
      }
    })();
    
    // Send an immediate response to acknowledge receipt
    sendResponse({ received: true });
    return true; // Required for async sendResponse
  }
  
  if (message.action === "generateTTS") {
    // Send the text for TTS conversion
    (async () => {
      try {
        const result = await sendTextToTTS(message.text);
        sendResponse(result);
      } catch (error) {
        console.error("Error in generateTTS handler:", error);
        sendResponse({ error: error.message || "Error generating speech. Please try again." });
      }
    })();
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  if (message.action === "transcribeAudio") {
    // Send the audio data for transcription
    transcribeAudioToBackend(message.data)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        console.error("Error in transcribeAudio handler:", error);
        sendResponse({ error: error.message });
      });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});
