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
      
      /* Custom blocks */
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
      
      /* Extension blocks */
      svg .sb3-extension {
        fill: #4b4a60;
        stroke: #000;
      }
      svg .sb3-extension-alt {
        fill: #4b4a60;
      }
      svg .sb3-extension-line {
        stroke: #fff;
      }
      svg .sb3-extension-dark {
        fill: #000;
      }
      
      /* Music extension */
      svg .sb3-music {
        fill: #bb42c3;
        stroke: #a932ad;
      }
      svg .sb3-music-alt {
        fill: #bd42bd;
      }
      svg .sb3-music-dark {
        fill: #78278c;
      }
      
      /* Pen extension */
      svg .sb3-pen {
        fill: #0fbd8c;
        stroke: #0b8e69;
      }
      svg .sb3-pen-alt {
        fill: #0da57a;
      }
      svg .sb3-pen-dark {
        fill: #0b8e69;
      }
      
      /* Video Sensing extension */
      svg .sb3-video {
        fill: #ec7c12;
        stroke: #cc670e;
      }
      svg .sb3-video-alt {
        fill: #d96a0a;
      }
      svg .sb3-video-dark {
        fill: #cc670e;
      }
      
      /* Text to Speech extension */
      svg .sb3-text2speech {
        fill: #906e9c;
        stroke: #7c5c85;
      }
      svg .sb3-text2speech-alt {
        fill: #886588;
      }
      svg .sb3-text2speech-dark {
        fill: #7c5c85;
      }
      
      /* Translate extension */
      svg .sb3-translate {
        fill: #4c97ff;
        stroke: #3373cc;
      }
      svg .sb3-translate-alt {
        fill: #4280d7;
      }
      svg .sb3-translate-dark {
        fill: #3373cc;
      }
      
      /* Makey Makey extension */
      svg .sb3-makeymakey {
        fill: #e64d2e;
        stroke: #cf4025;
      }
      svg .sb3-makeymakey-alt {
        fill: #df4425;
      }
      svg .sb3-makeymakey-dark {
        fill: #b73617;
      }
      
      /* micro:bit extension */
      svg .sb3-microbit {
        fill: #1e95ea;
        stroke: #166da5;
      }
      svg .sb3-microbit-alt {
        fill: #1a85d0;
      }
      svg .sb3-microbit-dark {
        fill: #166da5;
      }
      
      /* LEGO MINDSTORMS EV3 extension */
      svg .sb3-ev3 {
        fill: #d94c27;
        stroke: #b73117;
      }
      svg .sb3-ev3-alt {
        fill: #cc4422;
      }
      svg .sb3-ev3-dark {
        fill: #b73117;
      }
      
      /* LEGO WeDo 2.0 extension */
      svg .sb3-wedo {
        fill: #00c3e6;
        stroke: #0094b6;
      }
      svg .sb3-wedo-alt {
        fill: #00b3d7;
      }
      svg .sb3-wedo-dark {
        fill: #0094b6;
      }
      
      /* LEGO Education SPIKE extension */
      svg .sb3-spike {
        fill: #8958a8;
        stroke: #7a4a9a;
      }
      svg .sb3-spike-alt {
        fill: #855cad;
      }
      svg .sb3-spike-dark {
        fill: #bd42bd;
      }
    `;
    shadow.appendChild(style);
  }

  // Find all pre elements with scratchblocks class
  const preElements = shadow.querySelectorAll('pre.blocks');
  if (preElements.length === 0) {
    console.log("No scratchblocks found to render");
    return;
  }

  console.log(`Found ${preElements.length} scratchblocks to render`);

  // Check if scratchblocks is available
  if (typeof window.scratchblocks === 'undefined') {
    console.error("scratchblocks library not found");
    return;
  }

  // Render each scratchblock
  preElements.forEach((pre) => {
    try {
      // Get the code content
      const code = pre.textContent;
      
      // Clear the pre element
      pre.innerHTML = '';
      
      // Render the scratchblocks
      const svg = window.scratchblocks.render(code, {
        style: 'scratch3',
        languages: ['en'],
      });
      
      // Append the rendered SVG to the pre element
      pre.appendChild(svg);
      
      console.log("Successfully rendered a scratchblock");
    } catch (error) {
      console.error("Error rendering scratchblock:", error);
      // If there's an error, keep the original text
      pre.classList.add('render-error');
    }
  });
};
