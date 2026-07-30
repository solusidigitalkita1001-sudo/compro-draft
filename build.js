/**
 * build.js
 * ---------------------------------------------------------------
 * Build script SEDERHANA untuk static site berbasis HTML/CSS/JS +
 * Bootstrap 5 (tanpa framework, tanpa npm dependency).
 * Mendukung 2 bahasa: Indonesia (default, di root) & English (di /en/).
 *
 * Yang dilakukan:
 *   1. Untuk tiap bahasa, membaca source/pages/<locale>/*.html
 *   2. Meresolve directive <!--@include(partials/xxx.html)-->
 *   3. Mengganti placeholder {{TITLE}}, {{DESCRIPTION}}, dst dari page.config.json
 *   4. Mengganti token {{t.KEY}} dengan teks terjemahan dari source/i18n/<locale>.json
 *   5. Mengganti {{LANG_PREFIX}} pada link antar halaman (kosong untuk id, "en/" untuk en)
 *   6. Menyisipkan script/CSS tambahan per halaman (misal map.js hanya di contact.html)
 *   7. Menandai menu aktif (current-menu-item) otomatis berdasarkan nama halaman
 *   8. Menyisipkan tag hreflang + link language-switcher otomatis
 *   9. Menulis hasil akhir ke dist/ (id di root, en di dist/en/)
 *  10. Menyalin folder asset (css, js, image, icons, scss, contact) SEKALI ke dist/ root
 *      (aman dipakai kedua bahasa karena semua path asset sudah absolut "/css/...")
 *
 * Cara pakai:
 *   node build.js
 *
 * Hasil di folder dist/ itulah yang di-upload ke hosting client.
 * ---------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PARTIALS_DIR = path.join(ROOT, "source");
const OUTPUT_DIR = path.join(ROOT, "dist");
const CONFIG_PATH = path.join(ROOT, "page.config.json");
const I18N_DIR = path.join(ROOT, "source/i18n");

// Folder aset yang tinggal disalin apa adanya ke dist/ (tidak diproses)
const ASSET_DIRS = ["css", "js", "image", "icons", "scss", "contact"];

// -----------------------------------------------------------------
// Konfigurasi bahasa.
// - dirPrefix -> nama sub-folder OUTPUT di dist/ (filesystem, relatif)
// - urlPrefix -> prefix untuk href DI DALAM HTML (harus root-absolute,
//   diawali "/", supaya tidak jadi relatif terhadap folder saat ini.
//   Kalau cuma "en/" tanpa "/" di depan, waktu browser lagi buka
//   /en/index.html maka href="en/about-us.html" akan diartikan
//   relatif -> jadi /en/en/about-us.html, DOBEL. Makanya harus
//   root-absolute: "/en/about-us.html".)
// id = default, tampil di root. en = tampil di /en/.
// -----------------------------------------------------------------
const LOCALES = {
  id: { dirPrefix: "", urlPrefix: "/", htmlLang: "id", sibLocale: "id" },
  en: { dirPrefix: "en/", urlPrefix: "/en/", htmlLang: "en", sibLocale: "en" },
};

const pageConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

const EXTRA_SCRIPT_TAGS = {
  "js/jquery.nice-select.min.js": '    <script src="/js/jquery.nice-select.min.js"></script>',
  "js/swiper-bundle.min.js": '    <script src="/js/swiper-bundle.min.js"></script>',
  "js/carousel.js": '    <script src="/js/carousel.js"></script>',
  "js/odometer.min.js": '    <script src="/js/odometer.min.js"></script>',
  "js/jquery-validate.js": '    <script src="/js/jquery-validate.js"></script>',
  "js/textanimation.js": '    <script src="/js/textanimation.js"></script>',
  "js/map.min.js": '    <script src="/js/map.min.js"></script>',
  "js/map.js": '    <script src="/js/map.js"></script>',
};

const EXTRA_CSS_TAGS = {
  "css/swiper-bundle.min.css": '    <link rel="stylesheet" href="/css/swiper-bundle.min.css">',
  "css/nice-select.css": '    <link rel="stylesheet" href="/css/nice-select.css">',
  "css/odometer-theme-default.css": '    <link rel="stylesheet" href="/css/odometer-theme-default.css">',
  "css/textanimation.css": '    <link rel="stylesheet" href="/css/textanimation.css">',
  "css/map.min.css": '    <link rel="stylesheet" href="/css/map.min.css">',
};

function resolveIncludes(content) {
  const includeRegex = /<!--@include\((.+?)\)-->/g;
  return content.replace(includeRegex, (match, includePath) => {
    const fullPath = path.join(PARTIALS_DIR, includePath.trim());
    if (!fs.existsSync(fullPath)) {
      console.warn(`  ! Partial tidak ditemukan: ${includePath}`);
      return `<!-- MISSING PARTIAL: ${includePath} -->`;
    }
    const partialContent = fs.readFileSync(fullPath, "utf-8");
    return resolveIncludes(partialContent);
  });
}

function applyPageMeta(content, meta) {
  return content
    .replace(/\{\{TITLE\}\}/g, meta.title || "")
    .replace(/\{\{DESCRIPTION\}\}/g, meta.description || "")
    .replace(/\{\{KEYWORDS\}\}/g, meta.keywords || "")
    .replace(/\{\{BODY_CLASS\}\}/g, meta.bodyClass || "")
    .replace("{{FOOTER_MARQUEE}}", meta.footerMarquee || "");
}

function applyExtraScripts(content, extraScripts) {
  const tags = (extraScripts || [])
    .map((src) => EXTRA_SCRIPT_TAGS[src] || `    <script src="/${src}"></script>`)
    .join("\n");
  return content.replace("{{EXTRA_SCRIPTS}}", tags);
}

function applyExtraCss(content, extraCss) {
  const tags = (extraCss || [])
    .map((href) => EXTRA_CSS_TAGS[href] || `    <link rel="stylesheet" href="/${href}">`)
    .join("\n");
  return content.replace("{{EXTRA_CSS}}", tags);
}

function applyI18n(content, dict) {
  return content.replace(/\{\{t\.([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
    if (!(key in dict)) {
      console.warn(`  ! i18n key hilang: ${key}`);
      return match;
    }
    return dict[key];
  });
}

function applyLocaleTokens(content, locale, localeCfg, currentPage) {
  const otherLocale = locale === "id" ? "en" : "id";
  const otherUrlPrefix = LOCALES[otherLocale].urlPrefix;
  const langSwitchUrl = otherUrlPrefix + currentPage;

  return content
    .replace(/\{\{LANG_PREFIX\}\}/g, localeCfg.urlPrefix)
    .replace(/\{\{LOCALE\}\}/g, localeCfg.sibLocale)
    .replace(/\{\{HTML_LANG\}\}/g, localeCfg.htmlLang)
    .replace(/\{\{LANG_SWITCH_URL\}\}/g, langSwitchUrl);
}

function buildHreflangTags(currentPage) {
  const idUrl = LOCALES.id.urlPrefix + currentPage;
  const enUrl = LOCALES.en.urlPrefix + currentPage;
  return [
    `<link rel="alternate" hreflang="id" href="${idUrl}" />`,
    `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
    `<link rel="alternate" hreflang="x-default" href="${idUrl}" />`,
  ].join("\n    ");
}

function addClassToLiLine(line, className) {
  if (line.includes(className)) return line;
  return line.replace(/class="([^"]*)"/, (m, cls) => `class="${cls} ${className}"`);
}

function markSection(sectionHtml, currentPage, { parentClass, childClass, childLineRegex }) {
  const lines = sectionHtml.split("\n");
  let lastTopLiIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const isTopLevelLiOpen =
      /<li class="[^"]*menu-item[^"]*"/.test(line) && !childLineRegex.test(line);
    if (isTopLevelLiOpen) {
      lastTopLiIndex = i;
    }

    const hrefMatch = line.match(/href="(?:en\/)?([a-zA-Z0-9_-]+\.html)"/);
    if (hrefMatch && hrefMatch[1] === currentPage) {
      if (childLineRegex.test(line)) {
        lines[i] = addClassToLiLine(line, childClass);
        if (lastTopLiIndex !== -1) {
          lines[lastTopLiIndex] = addClassToLiLine(lines[lastTopLiIndex], parentClass);
        }
      } else if (lastTopLiIndex !== -1) {
        lines[lastTopLiIndex] = addClassToLiLine(lines[lastTopLiIndex], parentClass);
      }
    }
  }

  return lines.join("\n");
}

function processSection(html, startMarker, endMarker, processFn) {
  const si = html.indexOf(startMarker);
  if (si === -1) return html;
  const ei = html.indexOf(endMarker, si);
  if (ei === -1) return html;
  const eiFull = ei + endMarker.length;

  const before = html.slice(0, si);
  const section = html.slice(si, eiFull);
  const after = html.slice(eiFull);

  return before + processFn(section) + after;
}

function markActiveMenu(html, currentPage) {
  html = processSection(html, '<nav class="main-menu">', "</nav>", (section) =>
    markSection(section, currentPage, {
      parentClass: "current-menu-item",
      childClass: "current-item",
      childLineRegex: /class="sub-menu-item"/,
    })
  );

  html = processSection(html, '<nav class="mobile-main-nav">', "</nav>", (section) =>
    markSection(section, currentPage, {
      parentClass: "current-menu-mobile-item",
      childClass: "current-menu-mobile-item",
      childLineRegex: /<li class="menu-item"><a href=/,
    })
  );

  return html;
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function build() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const [locale, localeCfg] of Object.entries(LOCALES)) {
    const pagesDir = path.join(ROOT, "source/pages", locale);
    if (!fs.existsSync(pagesDir)) {
      console.warn(`! Folder ${pagesDir} tidak ada, lewati locale "${locale}"`);
      continue;
    }

    const i18nPath = path.join(I18N_DIR, `${locale}.json`);
    const dict = JSON.parse(fs.readFileSync(i18nPath, "utf-8"));

    const localeConfig = pageConfig[locale] || {};
    const outDir = path.join(OUTPUT_DIR, localeCfg.dirPrefix);
    fs.mkdirSync(outDir, { recursive: true });

    const pageFiles = fs.readdirSync(pagesDir).filter((f) => f.endsWith(".html"));

    for (const file of pageFiles) {
      const meta = localeConfig[file] || {};
      const raw = fs.readFileSync(path.join(pagesDir, file), "utf-8");

      let html = resolveIncludes(raw);
      html = applyPageMeta(html, meta);
      html = applyExtraScripts(html, meta.extraScripts);
      html = applyExtraCss(html, meta.extraCss);
      html = applyI18n(html, dict);
      html = applyLocaleTokens(html, locale, localeCfg, file);
      html = html.replace("{{HREFLANG_TAGS}}", buildHreflangTags(file));
      html = markActiveMenu(html, file);

      fs.writeFileSync(path.join(outDir, file), html);
      console.log(`✓ Built [${locale}] ${file}`);
    }
  }

  for (const dir of ASSET_DIRS) {
    copyDir(path.join(ROOT, dir), path.join(OUTPUT_DIR, dir));
  }
  console.log("✓ Assets copied");
  console.log(
    `\nSelesai. Folder "dist/" berisi versi Indonesia (root) dan English ("dist/en/"). Itu yang di-upload ke hosting.`
  );
}

build();