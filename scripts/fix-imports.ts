import fs from 'fs';
import path from 'path';

function fixImports(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixImports(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // RegEx to find standard imports: import ... from './something' or '../../something'
      const importRegex = /(import\s+.*?from\s+['"])([\.\/]+[\w\-\/]+)(['"])/g;
      let modified = false;

      content = content.replace(importRegex, (match, p1, p2, p3) => {
        // If it already has .js, .ts, .json, skip
        if (p2.endsWith('.js') || p2.endsWith('.ts') || p2.endsWith('.json')) {
          return match;
        }
        modified = true;
        return `${p1}${p2}.js${p3}`;
      });

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fixed imports in ${fullPath}`);
      }
    }
  }
}

fixImports('./api');
