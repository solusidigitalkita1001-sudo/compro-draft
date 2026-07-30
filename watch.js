/**
 * watch.js
 * ---------------------------------------------------------------
 * Dev watcher SEDERHANA -- tidak pakai dependency npm apapun
 * (murni modul bawaan Node: fs, path, child_process).
 *
 * Yang dilakukan:
 *   1. Jalankan `node build.js` sekali di awal
 *   2. Pantau perubahan file di folder source/, css/, js/, image/,
 *      icons/, scss/, contact/, serta file build.js & page.config.json
 *   3. Setiap ada perubahan (disimpan/save), otomatis jalankan
 *      `node build.js` lagi (dengan debounce supaya tidak double-run
 *      kalau editor nyimpen beberapa file sekaligus)
 *
 * Dipakai oleh docker-compose.dev.yml -- TIDAK dipakai untuk build
 * production (production tetap pakai Dockerfile multi-stage biasa).
 *
 * Catatan: kalau kamu menambahkan FOLDER BARU (bukan cuma file baru
 * di folder yang sudah ada), restart watcher-nya supaya folder baru
 * itu ikut terpantau:
 *   docker compose -f docker-compose.dev.yml restart build-watcher
 * ---------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const WATCH_DIRS = ["source", "css", "js", "image", "icons", "scss", "contact"];
const WATCH_FILES = ["build.js", "page.config.json"];
const DEBOUNCE_MS = 250;

let isBuilding = false;
let rebuildPending = false;
let debounceTimer = null;

function runBuild() {
  if (isBuilding) {
    rebuildPending = true;
    return;
  }
  isBuilding = true;
  const time = new Date().toLocaleTimeString("id-ID");
  console.log(`\n[${time}] Perubahan terdeteksi -> menjalankan node build.js ...`);
  try {
    execFileSync("node", ["build.js"], { stdio: "inherit", cwd: __dirname });
    console.log(`[${time}] Build selesai. Refresh browser kamu.`);
  } catch (err) {
    console.error(`[${time}] Build GAGAL:`, err.message);
  } finally {
    isBuilding = false;
    if (rebuildPending) {
      rebuildPending = false;
      scheduleBuild();
    }
  }
}

function scheduleBuild() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runBuild, DEBOUNCE_MS);
}

// Watch manual per-folder (bukan fs.watch recursive) supaya kompatibel
// di semua platform/Node version, termasuk Alpine Linux di container.
function watchRecursive(dir) {
  if (!fs.existsSync(dir)) return;

  try {
    fs.watch(dir, () => scheduleBuild());
  } catch (err) {
    console.warn(`! Gagal watch folder ${dir}:`, err.message);
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      watchRecursive(path.join(dir, entry.name));
    }
  }
}

console.log("=== Dev watcher aktif ===");
console.log("Memantau:", [...WATCH_DIRS, ...WATCH_FILES].join(", "));

// build pertama kali saat container start
runBuild();

for (const dir of WATCH_DIRS) {
  watchRecursive(dir);
}
for (const file of WATCH_FILES) {
  if (fs.existsSync(file)) {
    fs.watch(file, () => scheduleBuild());
  }
}

console.log("Siap. Edit & save file di source/, lalu tinggal refresh browser.\n");

// Supaya proses Node tidak exit (fs.watch saja tidak menahan event loop
// selamanya di beberapa kondisi) -- jaga container tetap hidup.
setInterval(() => {}, 1 << 30);
