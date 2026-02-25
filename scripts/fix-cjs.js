/**
 * Post-build script to rename CJS output files from .js to .cjs
 * and .d.ts to .d.cts, and fix internal import paths.
 */
import { readdir, rename, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const CJS_DIR = './dist/cjs';

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function fixCjs() {
  const files = await walk(CJS_DIR);

  // First, fix require/import paths in .js files to add .cjs extension
  for (const file of files) {
    if (file.endsWith('.js')) {
      let content = await readFile(file, 'utf-8');
      // Fix require("./...") paths
      content = content.replace(/require\("(\.[^"]+)\.js"\)/g, 'require("$1.cjs")');
      content = content.replace(/require\("(\.[^"]+)"\)/g, (match, p1) => {
        if (p1.endsWith('.cjs')) return match;
        return `require("${p1}.cjs")`;
      });
      await writeFile(file, content, 'utf-8');
    }
    if (file.endsWith('.d.ts')) {
      let content = await readFile(file, 'utf-8');
      content = content.replace(/from "(\.[^"]+)"/g, (match, p1) => {
        if (p1.endsWith('.cts') || p1.endsWith('.cts"')) return match;
        return `from "${p1}.cjs"`;
      });
      await writeFile(file, content, 'utf-8');
    }
  }

  // Rename .js -> .cjs, .d.ts -> .d.cts, .js.map -> .cjs.map, .d.ts.map -> .d.cts.map
  const allFiles = await walk(CJS_DIR);
  const renames = [];
  for (const file of allFiles) {
    if (file.endsWith('.d.ts.map')) {
      renames.push([file, file.replace(/\.d\.ts\.map$/, '.d.cts.map')]);
    } else if (file.endsWith('.d.ts')) {
      renames.push([file, file.replace(/\.d\.ts$/, '.d.cts')]);
    } else if (file.endsWith('.js.map')) {
      renames.push([file, file.replace(/\.js\.map$/, '.cjs.map')]);
    } else if (file.endsWith('.js')) {
      renames.push([file, file.replace(/\.js$/, '.cjs')]);
    }
  }

  for (const [from, to] of renames) {
    await rename(from, to);
  }

  console.log(`Renamed ${renames.length} files to CJS extensions.`);
}

fixCjs().catch(console.error);
