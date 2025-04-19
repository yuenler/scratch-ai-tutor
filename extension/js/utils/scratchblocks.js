// Scratchblocks rendering utilities for BlockBuddy

// Create a namespace for our scratchblocks utilities
window.BlockBuddy = window.BlockBuddy || {};
window.BlockBuddy.ScratchBlocks = window.BlockBuddy.ScratchBlocks || {};

/**
 * Function to render scratchblocks in shadow DOM using scratchblocks.render
 * @param {ShadowRoot} shadow - The shadow DOM root
 * @param {HTMLElement} [targetContainer] - Optional target container to limit rendering to
 */
window.BlockBuddy.ScratchBlocks.renderScratchblocks = function(shadow, targetContainer = null) {
  console.log("Attempting to render scratchblocks...", targetContainer ? "for specific container" : "for all messages");
  
  // Add scratchblocks CSS directly to shadow DOM
  if (!shadow.querySelector('#scratchblocks-style')) {
    const style = document.createElement('style');
    style.id = 'scratchblocks-style';
    
    // Full CSS for Scratch blocks - copied from the scratchblocks library
    style.textContent = `
.sb3-label {
  font: 500 12pt Helvetica Neue, Helvetica, sans-serif;
  word-spacing: +1pt;
}

.sb3-literal-number,
.sb3-literal-string,
.sb3-literal-number-dropdown,
.sb3-literal-dropdown {
  word-spacing: 0;
}

/* Note: comment colors are different from Scratch. */

.sb3-comment {
  fill: #ffffa5;
  stroke: #d0d1d2;
  stroke-width: 1;
}
.sb3-comment-line {
  fill: #ffff80;
}
.sb3-comment-label {
  font: 400 12pt Helvetica Neue, Helvetica, sans-serif;
  fill: #000;
  word-spacing: 0;
}

.sb3-diff {
  fill: none;
  stroke: #000;
}
.sb3-diff-ins {
  stroke-width: 2px;
}
.sb3-diff-del {
  stroke-width: 3px;
}


svg .sb3-motion {
  fill: #4c97ff;
  stroke: #3373cc;
}
svg .sb3-motion-alt {
  fill: #4280d7;
}
svg .sb3-motion-dark {
  fill: #3373cc;
}


svg .sb3-looks {
  fill: #9966ff;
  stroke: #774dcb;
}
svg .sb3-looks-alt {
  fill: #855cd6;
}
svg .sb3-looks-dark {
  fill: #774dcb;
}


svg .sb3-sound {
  fill: #cf63cf;
  stroke: #bd42bd;
}
svg .sb3-sound-alt {
  fill: #c94fc9;
}
svg .sb3-sound-dark {
  fill: #bd42bd;
}


svg .sb3-control {
  fill: #ffab19;
  stroke: #cf8b17;
}
svg .sb3-control-alt {
  fill: #ec9c13;
}
svg .sb3-control-dark {
  fill: #cf8b17;
}


svg .sb3-events {
  fill: #ffbf00;
  stroke: #cc9900;
}
svg .sb3-events-alt {
  fill: #e6ac00;
}
svg .sb3-events-dark {
  fill: #cc9900;
}


svg .sb3-sensing {
  fill: #5cb1d6;
  stroke: #2e8eb8;
}
svg .sb3-sensing-alt {
  fill: #47a8d1;
}
svg .sb3-sensing-dark {
  fill: #2e8eb8;
}


svg .sb3-operators {
  fill: #59c059;
  stroke: #389438;
}
svg .sb3-operators-alt {
  fill: #46b946;
}
svg .sb3-operators-dark {
  fill: #389438;
}


svg .sb3-variables {
  fill: #ff8c1a;
  stroke: #db6e00;
}
svg .sb3-variables-alt {
  fill: #ff8000;
}
svg .sb3-variables-dark {
  fill: #db6e00;
}


svg .sb3-list {
  fill: #ff661a;
  stroke: #e64d00;
}
svg .sb3-list-alt {
  fill: #ff5500;
}
svg .sb3-list-dark {
  fill: #e64d00;
}


svg .sb3-custom {
  fill: #ff6680;
  stroke: #ff3355;
}
svg .sb3-custom-alt {
  fill: #ff4d6a;
}
svg .sb3-custom-dark {
  fill: #ff3355;
}


svg .sb3-extension {
  fill: #0fbd8c;
  stroke: #0b8e69;
}
svg .sb3-extension-alt {
  fill: #0da57a;
}
svg .sb3-extension-dark {
  fill: #0b8e69;
}


svg .sb3-obsolete {
  fill: #ed4242;
  stroke: #ca2b2b;
}
svg .sb3-obsolete-alt {
  fill: #db3333;
}
svg .sb3-obsolete-dark {
  fill: #ca2b2b;
}


svg .sb3-grey {
  fill: #bfbfbf;
  stroke: #909090;
}
svg .sb3-grey-alt {
  fill: #b2b2b2;
}
svg .sb3-grey-dark {
  fill: #909090;
}


svg .sb3-label {
  fill: #fff;
}

svg .sb3-input-color {
  stroke: #fff;
}

svg .sb3-input-number,
svg .sb3-input-string {
  fill: #fff;
}
svg .sb3-literal-number,
svg .sb3-literal-string {
  fill: #575e75;
}


svg.scratchblocks-style-scratch3-high-contrast .sb3-motion {
  fill: #80b5ff;
  stroke: #3373cc;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-motion-alt {
  fill: #b3d2ff;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-motion-dark {
  fill: #3373cc;
}


svg.scratchblocks-style-scratch3-high-contrast .sb3-looks {
  fill: #ccb3ff;
  stroke: #774dcb;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-looks-alt {
  fill: #ddccff;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-looks-dark {
  fill: #774dcb;
}


svg.scratchblocks-style-scratch3-high-contrast .sb3-sound {
  fill: #e19de1;
  stroke: #bd42bd;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-sound-alt {
  fill: #ffb3ff;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-sound-dark {
  fill: #bd42bd;
}


svg.scratchblocks-style-scratch3-high-contrast .sb3-control {
  fill: #ffbe4c;
  stroke: #cf8b17;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-control-alt {
  fill: #ffda99;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-control-dark {
  fill: #cf8b17;
}


svg.scratchblocks-style-scratch3-high-contrast .sb3-events {
  fill: #ffd966;
  stroke: #cc9900;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-events-alt {
  fill: #ffecb3;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-events-dark {
  fill: #cc9900;
}


svg.scratchblocks-style-scratch3-high-contrast .sb3-sensing {
  fill: #85c4e0;
  stroke: #2e8eb8;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-sensing-alt {
  fill: #aed8ea;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-sensing-dark {
  fill: #2e8eb8;
}


svg.scratchblocks-style-scratch3-high-contrast .sb3-operators {
  fill: #7ece7e;
  stroke: #389438;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-operators-alt {
  fill: #b5e3b5;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-operators-dark {
  fill: #389438;
}


svg.scratchblocks-style-scratch3-high-contrast .sb3-variables {
  fill: #ffa54c;
  stroke: #db6e00;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-variables-alt {
  fill: #ffcc99;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-variables-dark {
  fill: #db6e00;
}


svg.scratchblocks-style-scratch3-high-contrast .sb3-list {
  fill: #ff9966;
  stroke: #e64d00;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-list-alt {
  fill: #ffcab0;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-list-dark {
  fill: #e64d00;
}


svg.scratchblocks-style-scratch3-high-contrast .sb3-custom {
  fill: #ff99aa;
  stroke: #e64d00;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-custom-alt {
  fill: #ffccd5;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-custom-dark {
  fill: #e64d00;
}


svg.scratchblocks-style-scratch3-high-contrast .sb3-extension {
  fill: #13ecaf;
  stroke: #0b8e69;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-extension-alt {
  fill: #75f0cd;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-extension-dark {
  fill: #0b8e69;
}


svg.scratchblocks-style-scratch3-high-contrast .sb3-obsolete {
  fill: #fc6666;
  stroke: #d32121;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-obsolete-alt {
  fill: #fcb0b0;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-obsolete-dark {
  fill: #d32121;
}


svg.scratchblocks-style-scratch3-high-contrast .sb3-grey {
  fill: #bfbfbf;
  stroke: #959595;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-grey-alt {
  fill: #b2b2b2;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-grey-dark {
  fill: #959595;
}


svg.scratchblocks-style-scratch3-high-contrast .sb3-label {
  fill: #000;
}

svg.scratchblocks-style-scratch3-high-contrast .sb3-input-color {
  stroke: #fff;
}

svg.scratchblocks-style-scratch3-high-contrast .sb3-input-number,
svg.scratchblocks-style-scratch3-high-contrast .sb3-input-string {
  fill: #fff;
}
svg.scratchblocks-style-scratch3-high-contrast .sb3-literal-number,
svg.scratchblocks-style-scratch3-high-contrast .sb3-literal-string {
  fill: #000;
}
      `;
      
      shadow.appendChild(style);
      console.log("Added scratchblocks styles to shadow DOM");
    }


  // Find all pre elements with blocks class, optionally within a specific container
  let preElements;
  if (targetContainer) {
    preElements = targetContainer.querySelectorAll('pre.blocks');
    console.log(`Targeting only blocks within specific container, found: ${preElements.length}`);
  } else {
    preElements = shadow.querySelectorAll('pre.blocks');
    console.log(`Targeting all blocks in shadow DOM, found: ${preElements.length}`);
  }
  
  // Debug: Log all pre elements to see what's available
  if (preElements.length === 0) {
    console.log("No scratchblocks found to render");
    if (!targetContainer) {
      console.log("All pre elements:", shadow.querySelectorAll('pre'));
      console.log("All message content elements:", shadow.querySelectorAll('.message-content'));
    }
    return;
  }

  console.log(`Found ${preElements.length} scratchblocks to render`);

  // Check if scratchblocks is available
  if (typeof window.scratchblocks === 'undefined') {
    console.error("scratchblocks library not found");
    
    // Try to load the scratchblocks library
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('js/libs/scratchblocks-v3.6-min.js');
    document.head.appendChild(script);
    
    script.onload = function() {
      console.log("Scratchblocks library loaded, retrying render");
      // Try rendering again after library is loaded
      setTimeout(() => window.BlockBuddy.ScratchBlocks.renderScratchblocks(shadow, targetContainer), 500);
    };
    
    script.onerror = function() {
      console.error("Failed to load scratchblocks library");
    };
    
    return;
  }

  // Render each scratchblock
  preElements.forEach((pre, index) => {
    // Skip if already rendered
    if (pre.getAttribute('data-rendered') === 'true') {
      console.log(`Skipping already rendered scratchblock ${index + 1}`);
      return;
    }
    
    try {
      console.log(`Rendering scratchblock ${index + 1}:`, pre.textContent.substring(0, 50) + '...');
      
      // Get the code content
      const code = pre.textContent;
      
      // Clear the pre element
      pre.innerHTML = '';

      // Create the rendered blocks
      const doc = scratchblocks.parse(code, {
        languages: ['en']
      });
      const svg = scratchblocks.render(doc, {
        style: 'scratch3'
      });
      
      // Add the SVG to the pre element
      pre.appendChild(svg);
      
      // Mark as rendered to avoid re-rendering
      pre.setAttribute('data-rendered', 'true');
      
      console.log(`Successfully rendered scratchblock ${index + 1}`);
    } catch (error) {
      console.error(`Error rendering scratchblock ${index + 1}:`, error);
      // Show the error and the original code
      pre.innerHTML = `<div class="error">Error rendering blocks: ${error.message}</div><code>${pre.textContent}</code>`;
    }
  });
};
