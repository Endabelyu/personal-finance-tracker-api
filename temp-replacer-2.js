const fs = require('fs');

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Text colors
  content = content.replace(/text-\[\#5c4a44\](?!\/)/g, 'text-[var(--text-primary)]');
  content = content.replace(/text-\[\#5c4a44\]\/80/g, 'text-[var(--text-secondary)]');
  content = content.replace(/text-\[\#5c4a44\]\/60/g, 'text-[var(--text-secondary)]');
  content = content.replace(/text-\[\#5c4a44\]\/50/g, 'text-[var(--text-secondary)]');
  content = content.replace(/text-\[\#c0544a\]/g, 'text-rose-500');
  content = content.replace(/text-\[\#4a9473\]/g, 'text-emerald-500');
  content = content.replace(/text-\[\#e07b6a\]/g, 'text-rose-400');
  content = content.replace(/text-\[\#9acbb1\]/g, 'text-emerald-400');
  
  // Backgrounds
  content = content.replace(/bg-\[\#FAF0E6\]/g, 'glass-card');
  content = content.replace(/bg-\[\#E8F5EF\]/g, 'glass-card');
  content = content.replace(/bg-\[\#FAE8E5\]/g, 'glass-card');
  content = content.replace(/bg-\[\#F5E6D8\]/g, 'glass-card');
  content = content.replace(/bg-white(?!\/)/g, 'bg-white/50 dark:bg-black/20 backdrop-blur-[10px]');
  
  // Secondary background with opacity
  content = content.replace(/bg-\[\#5c4a44\]\/8/g, 'bg-[var(--text-primary)]/10');
  content = content.replace(/bg-\[\#5c4a44\]\/10/g, 'bg-[var(--text-primary)]/10');
  content = content.replace(/bg-\[\#9acbb1\]\/25/g, 'bg-emerald-500/20');
  content = content.replace(/bg-\[\#e07b6a\]\/20/g, 'bg-rose-500/20');

  // Borders
  content = content.replace(/border-2 border-\[\#5c4a44\](?!\/)/g, 'border border-[var(--card-border)]');
  content = content.replace(/border-2 border-\[\#5c4a44\]\/15/g, ''); // we don't need borders on glass-cards, glass-card handles it
  content = content.replace(/border-\[\#5c4a44\]\/15/g, 'border-[var(--card-border)]');
  content = content.replace(/border-2 border-\[\#c0544a\]/g, 'border border-rose-500/30');

  // Shadow
  content = content.replace(/shadow-\[4px_4px_0_0_\#5c4a44\]/g, 'shadow-lg');
  content = content.replace(/shadow-\[0_4px_0_0_\#5c4a44\]/g, 'shadow-md');

  // Rings
  content = content.replace(/ring-\[\#5c4a44\]\/20/g, 'ring-[var(--gradient-hero-start)]/20');
  
  // Fix rounded-[2rem]
  content = content.replace(/rounded-\[2rem\]/g, 'rounded-[1.5rem]');

  fs.writeFileSync(filePath, content, 'utf8');
}

processFile('app/routes/_app.transactions.tsx');
console.log('Processed _app.transactions.tsx');
