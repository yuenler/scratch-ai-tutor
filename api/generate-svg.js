// This endpoint generates SVG from scratchblocks code
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a virtual DOM environment with required browser globals
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body>
  <div id="scratch-blocks-container"></div>
</body>
</html>
`, {
  url: "https://example.org/",
  referrer: "https://example.com/",
  contentType: "text/html",
  includeNodeLocations: true,
  storageQuota: 10000000,
  runScripts: "dangerously"
});

// Set up globals that scratchblocks might expect
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.SVGElement = dom.window.SVGElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.XMLSerializer = dom.window.XMLSerializer;
global.DOMParser = dom.window.DOMParser;

// Create a fetch polyfill for Node.js (required by scratchblocks)
global.fetch = async (url) => {
  return {
    ok: true,
    text: async () => "mocked response",
    json: async () => ({}),
  };
};

// Define requestAnimationFrame for Node environment
global.requestAnimationFrame = callback => {
  return setTimeout(callback, 0);
};

// Define cancelAnimationFrame for Node environment
global.cancelAnimationFrame = id => {
  clearTimeout(id);
};

// Load the scratchblocks library
const scratchblocksPath = path.join(__dirname, 'lib/scratchblocks-min.js');
const translationsPath = path.join(__dirname, 'lib/translations-all.js');

// Inject library code into the global context
const scratchblocksCode = fs.readFileSync(scratchblocksPath, 'utf8');
const translationsCode = fs.readFileSync(translationsPath, 'utf8');

// Run the scripts in the virtual DOM
dom.window.eval(scratchblocksCode);
dom.window.eval(translationsCode);

// Create a wrapper for the scratchblocks renderer
const renderScratchblocks = (code) => {
  try {
    // Get the scratchblocks object from the window
    const scratchblocks = dom.window.scratchblocks;
    
    if (!scratchblocks) {
      throw new Error('scratchblocks library not properly loaded');
    }
    
    // Render to SVG and get the DOM element
    const svgElement = scratchblocks.render(code, {
      style: 'scratch3',
      languages: ['en']
    });
    
    // Use XMLSerializer to convert the SVG element to a string
    const serializer = new dom.window.XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    
    return svgString;
  } catch (error) {
    console.error('Error rendering scratchblocks:', error);
    throw error;
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Parse request body
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (error) {
        console.error('Failed to parse JSON body:', error);
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }

    const { code } = body;
    if (!code) {
      return res.status(400).json({ error: 'Missing "code" in request body' });
    }

    console.log('Received scratchblocks code:', code);

    // Attempt to render scratchblocks
    try {
      const svgString = renderScratchblocks(code);
      
      // If rendering successful, return the SVG
      return res.status(200).json({ 
        svg: svgString,
        success: true
      });
    } catch (renderError) {
      console.error('Render error:', renderError);
      
      // Return a more detailed error response
      return res.status(500).json({ 
        error: 'Error rendering scratchblocks', 
        details: renderError.message,
        stack: renderError.stack,
        code: code
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
}
