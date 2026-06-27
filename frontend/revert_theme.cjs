const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

const replacements = [
  // Backgrounds
  { regex: /bg-slate-900/g, replacement: 'bg-slate-50' },
  { regex: /bg-slate-800\/50/g, replacement: 'bg-slate-50' },
  { regex: /bg-slate-800/g, replacement: 'bg-white' },
  
  // Text
  { regex: /text-slate-50/g, replacement: 'text-slate-900' },
  { regex: /text-slate-200/g, replacement: 'text-slate-900' },
  { regex: /text-slate-300/g, replacement: 'text-slate-700' },
  { regex: /text-slate-400/g, replacement: 'text-slate-500' },
  { regex: /text-slate-500/g, replacement: 'text-slate-400' },

  // Borders
  { regex: /border-slate-800/g, replacement: 'border-slate-100' },
  { regex: /border-slate-700/g, replacement: 'border-slate-200' },

  // Hover states
  { regex: /hover:bg-slate-900/g, replacement: 'hover:bg-slate-50' },
  { regex: /hover:bg-slate-800/g, replacement: 'hover:bg-slate-100' },
];

function processDirectory(directory) {
  fs.readdirSync(directory).forEach(file => {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let originalContent = content;
      replacements.forEach(({ regex, replacement }) => {
        content = content.replace(regex, replacement);
      });

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  });
}

processDirectory(directoryPath);
console.log('Theme reversion complete.');
