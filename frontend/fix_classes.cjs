const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function fixDirectory(directory) {
  fs.readdirSync(directory).forEach(file => {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let originalContent = content;
      // Fix text-slate-9000 -> text-slate-500
      content = content.replace(/text-slate-9000/g, 'text-slate-500');

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed: ${fullPath}`);
      }
    }
  });
}

fixDirectory(directoryPath);
console.log('Done fixing.');
