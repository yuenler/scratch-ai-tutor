// Background script for Scratch AI Tutor

// Function to render scratchblocks in the page context
function renderScratchblocksInPage(blockData) {
  console.log("Rendering scratchblocks in page context:", blockData);
  
  try {
    // Check if scratchblocks is available
    if (typeof scratchblocks === 'undefined') {
      console.error("scratchblocks not available in page context");
      return { success: false, error: "scratchblocks not available" };
    }
    
    // Get the container element
    const container = document.getElementById(blockData.containerId);
    if (!container) {
      console.error("Container not found:", blockData.containerId);
      return { success: false, error: "container not found" };
    }
    
    // Render the block
    const svg = scratchblocks.render(blockData.code, {
      style: 'scratch3',
      languages: ['en']
    });
    
    // Clear the container and append the SVG
    container.innerHTML = '';
    container.appendChild(svg);
    container.dataset.rendered = 'true';
    
    console.log("Successfully rendered block:", blockData.containerId);
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
    
    // Load the main library
    const script1 = document.createElement('script');
    script1.src = urls.scratchblocksUrl;
    
    script1.onload = function() {
      console.log("Scratchblocks library loaded in page context");
      
      // Load translations after main library is loaded
      const script2 = document.createElement('script');
      script2.src = urls.translationsUrl;
      
      script2.onload = function() {
        console.log("Scratchblocks translations loaded in page context");
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
});
