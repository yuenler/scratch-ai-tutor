// Scratchblocks rendering utilities for Scratch AI Tutor

// Create a namespace for our scratchblocks utilities
window.ScratchAITutor = window.ScratchAITutor || {};
window.ScratchAITutor.ScratchBlocks = window.ScratchAITutor.ScratchBlocks || {};

/**
 * Function to render scratchblocks in shadow DOM using scratchblocks.render
 * @param {ShadowRoot} shadow - The shadow DOM root
 */
window.ScratchAITutor.ScratchBlocks.renderScratchblocks = function(shadow) {
  console.log("Attempting to render scratchblocks...");
  
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
        
        /* Motion blocks */
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
        
        /* Looks blocks */
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
        
        /* Sound blocks */
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
        
        /* Control blocks */
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
        
        /* Event blocks */
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
        
        /* Sensing blocks */
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
        
        /* Operator blocks */
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
        
        /* Variables blocks */
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
        
        /* List blocks */
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
      `;
      
      shadow.appendChild(style);
      console.log("Added scratchblocks styles to shadow DOM");
    }


  // Find all pre elements with blocks class
  const preElements = shadow.querySelectorAll('pre.blocks');
  
  // Debug: Log all pre elements to see what's available
  console.log("All pre elements:", shadow.querySelectorAll('pre'));
  console.log("All message content elements:", shadow.querySelectorAll('.message-content'));
  
  if (preElements.length === 0) {
    console.log("No scratchblocks found to render");
    return;
  }

  console.log(`Found ${preElements.length} scratchblocks to render`);

  // Check if scratchblocks is available
  if (typeof window.scratchblocks === 'undefined') {
    console.error("scratchblocks library not found");
    
    // Try to load the scratchblocks library
    const script = document.createElement('script');
    script.src = 'https://scratchblocks.github.io/js/scratchblocks-v3.6-min.js';
    document.head.appendChild(script);
    
    script.onload = function() {
      console.log("Scratchblocks library loaded, retrying render");
      // Try rendering again after library is loaded
      setTimeout(() => window.ScratchAITutor.ScratchBlocks.renderScratchblocks(shadow), 500);
    };
    
    script.onerror = function() {
      console.error("Failed to load scratchblocks library");
    };
    
    return;
  }

  // Render each scratchblock
  preElements.forEach((pre, index) => {
    try {
      console.log(`Rendering scratchblock ${index + 1}:`, pre.textContent);
      
      // Get the code content
      const code = pre.textContent;
      
      // Clear the pre element
      pre.innerHTML = '';

      console.log(code);
      
      const doc = scratchblocks.parse(code, {
        languages: ['en']
      });
      const svg = scratchblocks.render(doc, {
        style: 'scratch3',
        scale: 1
      });
      
      // Append the rendered SVG to the pre element
      pre.appendChild(svg);
      
      console.log(`Successfully rendered scratchblock ${index + 1}`);
    } catch (error) {
      console.error(`Error rendering scratchblock ${index + 1}:`, error);
      // If there's an error, keep the original text
      pre.classList.add('render-error');
    }
  });
};
