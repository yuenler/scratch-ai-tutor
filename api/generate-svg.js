// This endpoint generates SVG from scratchblocks code
import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

// Create a virtual DOM environment
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
  runScripts: 'dangerously',
  resources: 'usable'
});
const window = dom.window;
const document = window.document;

// Load scratchblocks libraries
const scratchblocksCode = fs.readFileSync(path.join(process.cwd(), 'api/lib/scratchblocks-min.js'), 'utf8');
const translationsCode = fs.readFileSync(path.join(process.cwd(), 'api/lib/translations-all.js'), 'utf8');

// Inject scripts into virtual DOM
const script1 = document.createElement('script');
script1.textContent = scratchblocksCode;
document.body.appendChild(script1);

const script2 = document.createElement('script');
script2.textContent = translationsCode;
document.body.appendChild(script2);

// Create container for rendering
const container = document.createElement('div');
container.id = 'scratchblocks-container';
document.body.appendChild(container);

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

    // Render scratchblocks to SVG
    try {
      // Access scratchblocks from window context
      if (!window.scratchblocks) {
        return res.status(500).json({ error: 'Scratchblocks library not loaded properly' });
      }
      
      // Render the code to SVG
      const svg = window.scratchblocks.render(code, { style: 'scratch3', languages: ['en'] });
      
      // Convert SVG element to string
      const svgString = svg.outerHTML;
      
      return res.status(200).json({ svg: svgString });
    } catch (error) {
      console.error('Error rendering scratchblocks:', error);
      return res.status(500).json({ 
        error: 'Error rendering scratchblocks', 
        details: error.message,
        stack: error.stack
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: error.message });
  }
}
