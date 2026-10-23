// Move the site to a custom domain in one go.
// Usage (from the website folder):  node tools/set-domain.mjs kodivolabs.com
//
// What it does:
//   1. Replaces https://agamsahu017.github.io with https://<domain> in every
//      page, the sitemap and robots.txt (canonical links, social previews, schema).
//   2. Writes the CNAME file GitHub Pages needs for a custom domain.
// After running it, also:
//   - add the DNS records shown in GitHub → Settings → Pages,
//   - add https://<domain> to ALLOWED_ORIGINS in kodivo-visitor-counter/wrangler.toml
//     and redeploy the Worker (otherwise visits and forms are rejected),
//   - commit and push.
import fs from "node:fs";
import path from "node:path";

const domain = (process.argv[2] || "").trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(domain)) {
  console.error("Usage: node tools/set-domain.mjs yourdomain.com");
  process.exit(1);
}
const OLD = "https://agamsahu017.github.io";
const NEW = `https://${domain}`;

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "tools"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(html|xml|txt|js)$/.test(entry.name)) files.push(full);
  }
})(".");

let changed = 0;
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  if (!text.includes(OLD)) continue;
  fs.writeFileSync(file, text.split(OLD).join(NEW));
  console.log("updated", file);
  changed++;
}
fs.writeFileSync("CNAME", domain + "\n");
console.log(`\n${changed} files now point to ${NEW}. CNAME written.`);
