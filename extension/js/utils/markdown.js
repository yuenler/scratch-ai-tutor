// Markdown parsing utilities for Scratch AI Tutor

// Create a namespace for our markdown utilities
window.ScratchAITutor = window.ScratchAITutor || {};
window.ScratchAITutor.Markdown = window.ScratchAITutor.Markdown || {};

/**
 * Parse markdown text to HTML
 * @param {string} text - The markdown text to parse
 * @returns {string} The parsed HTML
 */
window.ScratchAITutor.Markdown.parseMarkdown = function(text) {
  if (!text) return '';
  
  // Process scratchblocks code blocks first (special handling)
  text = text.replace(/```scratchblocks\n([\s\S]*?)\n```/g, function(match, code) {
    console.log("Found scratchblocks code block:", code);
    return `<div class="scratchblocks-container" style="border: 2px dashed red; padding: 10px; margin: 10px 0;"><pre class="blocks">${window.ScratchAITutor.Utils.escapeHtml(code)}</pre></div>`;
  });
  
  // Process other code blocks with syntax highlighting
  text = text.replace(/```(\w*)\n([\s\S]*?)\n```/g, function(match, language, code) {
    if (language === 'scratch') {
      console.log("Found scratch code block:", code);
      return `<div class="scratchblocks-container" style="border: 2px dashed blue; padding: 10px; margin: 10px 0;"><pre class="blocks">${window.ScratchAITutor.Utils.escapeHtml(code)}</pre></div>`;
    }
    return `<pre class="code-block ${language}">${window.ScratchAITutor.Utils.escapeHtml(code)}</pre>`;
  });

  // Process inline code
  text = text.replace(/`([^`]+)`/g, (match, code) => {
    return `<code>${window.ScratchAITutor.Utils.escapeHtml(code)}</code>`;
  });

  // Process bold text
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Process italic text
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Process headers
  text = text.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  text = text.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  text = text.replace(/^# (.*$)/gm, '<h1>$1</h1>');

  // Process lists
  text = text.replace(/^\s*\* (.*$)/gm, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>');

  // Process numbered lists
  text = text.replace(/^\s*\d+\. (.*$)/gm, '<li>$1</li>');
  text = text.replace(/(<li>.*<\/li>)/gms, (match) => {
    if (!match.includes('<ul>')) {
      return '<ol>' + match + '</ol>';
    }
    return match;
  });

  // Process links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

  // Process paragraphs (must come last)
  text = text.replace(/^(?!<[a-z])/gm, '<p>');
  text = text.replace(/^<p>(.*)$/gm, (match, content) => {
    if (content.trim() === '') return '';
    if (content.startsWith('<h') || 
        content.startsWith('<ul') || 
        content.startsWith('<ol') || 
        content.startsWith('<p') || 
        content.startsWith('<pre')) {
      return content;
    }
    return `<p>${content}</p>`;
  });

  return text;
};
