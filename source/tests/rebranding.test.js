const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sourceDir = path.resolve(__dirname, "..");

function collectPublicFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "tests") return [];
      return collectPublicFiles(fullPath);
    }

    if (entry.name === "NALARA-REBRANDING-MATERIAL-CHECKLIST.md") return [];
    return /\.(html|json)$/.test(entry.name) ? [fullPath] : [];
  });
}

test("public source uses the Nalara identity and work email", () => {
  const publicSource = collectPublicFiles(sourceDir)
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");

  assert.doesNotMatch(publicSource, /Solusi Digital Kita|solusidigitalkita1001@gmail\.com|support@gmail\.com|themesflat\.com/);
  assert.match(publicSource, /Nalara Karya Indonesia/);
  assert.match(publicSource, /mailto:support@nalara\.digital/);
});

test("shared chrome uses the supplied Nalara logo and palette", () => {
  const header = fs.readFileSync(path.join(sourceDir, "partials/header.html"), "utf8");
  const mobile = fs.readFileSync(path.join(sourceDir, "partials/offcanvas-mobile.html"), "utf8");
  const megamenu = fs.readFileSync(path.join(sourceDir, "partials/offcanvas-megamenu.html"), "utf8");
  const preloader = fs.readFileSync(path.join(sourceDir, "partials/preloader.html"), "utf8");
  const head = fs.readFileSync(path.join(sourceDir, "partials/head-links.html"), "utf8");

  for (const chrome of [header, mobile, megamenu]) {
    assert.match(chrome, /partials\/brand-logo\.html/);
  }
  assert.match(preloader, /partials\/brand-mark\.html/);

  for (const color of ["#172B4D", "#2D5B87", "#2D8078", "#C79A52", "#F7F5F0"]) {
    assert.match(head, new RegExp(color, "i"));
  }
});

test("portfolio navigation remains hidden", () => {
  const header = fs.readFileSync(path.join(sourceDir, "partials/header.html"), "utf8");
  const mobile = fs.readFileSync(path.join(sourceDir, "partials/offcanvas-mobile.html"), "utf8");

  assert.match(header, /Portfolio menu is temporarily hidden/);
  assert.match(mobile, /Portfolio menu is temporarily hidden/);
});

test("page metadata no longer inherits the former brand from external configuration", () => {
  const pagesDir = path.join(sourceDir, "pages");

  for (const page of fs.readdirSync(pagesDir).filter((name) => name.endsWith(".html"))) {
    const html = fs.readFileSync(path.join(pagesDir, page), "utf8");
    assert.doesNotMatch(html, /\{\{TITLE\}\}|\{\{DESCRIPTION\}\}/, page);
    assert.match(html, /<title>Nalara Karya Indonesia<\/title>/, page);
  }
});

test("unverified client claims and portfolio sections stay hidden", () => {
  const head = fs.readFileSync(path.join(sourceDir, "partials/head-links.html"), "utf8");

  assert.match(head, /\.section-counting[\s\S]*display:\s*none\s*!important/);
  assert.match(head, /\.section-testimonial/);
  assert.match(head, /\.section-project/);
  assert.match(head, /\.wg-cta \.right/);
});
