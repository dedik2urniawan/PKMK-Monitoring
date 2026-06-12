const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./app/api');
files.push('./lib/appUser.ts');

let count = 0;
files.forEach(file => {
  // Skip auth session route
  if (file.includes('session') && file.includes('route.ts')) return;
  if (file.includes('auth') && file.includes('me')) return;

  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('import { createClient } from "@/lib/supabase/server"')) {
    content = content.replace('import { createClient } from "@/lib/supabase/server"', 'import { createAdminClient as createClient } from "@/lib/supabase/server"');
    fs.writeFileSync(file, content, 'utf8');
    count++;
  } else if (content.includes("import { createClient } from '@/lib/supabase/server'")) {
    content = content.replace("import { createClient } from '@/lib/supabase/server'", "import { createAdminClient as createClient } from '@/lib/supabase/server'");
    fs.writeFileSync(file, content, 'utf8');
    count++;
  }
});
console.log('Modified ' + count + ' files.');
