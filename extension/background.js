// Background script for Scratch AI Tutor

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
    const apiUrl = "https://scratch-ai-tutor.vercel.app/api/scratch-ai";
    
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
    console.log("API response:", result);
    
    return result;
  } catch (error) {
    console.error("Error sending question to API:", error);
    return { 
      error: `Network error: ${error.message}` 
    };
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
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "executeScript") {
    // Execute the script in the tab that sent the message
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: request.func,
      args: request.args || []
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
  
  if (request.action === "renderScratchblocks") {
    // Execute the rendering function in the tab that sent the message
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: renderScratchblocksInPage,
      args: [request.blockData]
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
  
  if (request.action === "loadScratchblocksLibraries") {
    // Execute the loading function in the tab that sent the message
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: loadScratchblocksLibraries,
      args: [request.urls]
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
  
  if (request.action === "sendQuestion") {
    // Send the question to the backend API
    sendQuestionToBackend(request.data)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        console.error("Error in sendQuestion handler:", error);
        sendResponse({ error: error.message });
      });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  if (request.action === "transcribeAudio") {
    // Send the audio data for transcription
    transcribeAudioToBackend(request.data)
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
