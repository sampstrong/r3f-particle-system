import fs from 'fs';
import path from 'path';

const distDir = './dist';
const files = fs.readdirSync(distDir);

files.forEach(file => {
  if (file.endsWith('.js')) {
    let content = fs.readFileSync(path.join(distDir, file), 'utf8');
    content = content.replace(/\.ts/g, '.js');
    fs.writeFileSync(path.join(distDir, file), content);
  }
});