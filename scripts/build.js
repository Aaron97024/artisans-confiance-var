// Stages only the deployable static site (index.html + assets/) into .cf-pages/,
// so `wrangler pages deploy` never uploads _originals/ or other repo-only files.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const outDir = path.join(root, ".cf-pages");

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

fs.copyFileSync(path.join(root, "index.html"), path.join(outDir, "index.html"));
fs.cpSync(path.join(root, "assets"), path.join(outDir, "assets"), { recursive: true });

console.log(`Staged deploy output in ${outDir}`);
