// Markdown parsing utilities for BlockBuddy

// Create a namespace for our markdown utilities
window.BlockBuddy = window.BlockBuddy || {};
window.BlockBuddy.Markdown = window.BlockBuddy.Markdown || {};

/**
 * Parse markdown text to HTML
 * @param {string} text - The markdown text to parse
 * @returns {string} The parsed HTML
 */
window.BlockBuddy.Markdown.parseMarkdown = function(text) {
  if (!text) return '';

  // find every instance of ```scratchblocks and add a \n after if there isn't one
  text = text.replace(/```scratchblocks([^\n])/g, '```scratchblocks\n$1');
  
  // Add a newline before closing triple backt`icks if there isn't one
  // Look for blocks that start with ```scratchblocks and end with ``` without a newline
  text = text.replace(/(```scratchblocks\n[\s\S]*?)([^\n])```/g, '$1$2\n```');
  
  // Process scratchblocks code blocks first (special handling)
  text = text.replace(/```scratchblocks\n([\s\S]*?)\n```/g, function(match, code) {
    return `<div class="scratchblocks-container" style="padding: 10px; margin: 10px 0;"><pre class="blocks">${window.BlockBuddy.Utils.escapeHtml(code)}</pre></div>`;
  });


  // Process other code blocks with syntax highlighting
  text = text.replace(/```(\w*)\n([\s\S]*?)\n```/g, function(match, language, code) {
    if (language === 'scratch') {
      return `<div class="scratchblocks-container" style="padding: 10px; margin: 10px 0;"><pre class="blocks">${window.BlockBuddy.Utils.escapeHtml(code)}</pre></div>`;
    }
    return `<pre class="code-block ${language}">${window.BlockBuddy.Utils.escapeHtml(code)}</pre>`;
  });

  // Process inline code
  text = text.replace(/`([^`]+)`/g, (match, code) => {
    return `<code>${window.BlockBuddy.Utils.escapeHtml(code)}</code>`;
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
