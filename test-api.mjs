import fs from 'fs';
const t = fs.readFileSync('github-token.txt', 'utf8').trim();
const r = await fetch('https://api.github.com/repos/Z-oobastik-s/Zhorror', {
  headers: { Authorization: `Bearer ${t}`, Accept: 'application/vnd.github+json' },
});
const d = await r.json();
console.log(r.status, d.full_name || d.message);
