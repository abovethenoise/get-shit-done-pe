#!/usr/bin/env node
// Auto-Update Hook - SessionStart hook
// Checks npm registry for newer versions of get-shit-done-pe once per 24 hours
// and installs updates silently in the background.
//
// Contract:
// - NEVER prints to stdout or stderr
// - NEVER exits with non-zero code
// - All errors are swallowed silently
// - Background update uses spawn+detach+unref so this process exits immediately

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { spawn } = require('child_process');

const THROTTLE_MS = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_DIR = path.join(os.homedir(), '.claude', 'get-shit-done');
const CACHE_PATH = path.join(CACHE_DIR, '.update-check');
const REGISTRY_URL = 'https://registry.npmjs.org/get-shit-done-pe/latest';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    // stdin drained above (hook protocol) — contents not used

    // Read cache
    let cache = {};
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    } catch (e) {
      // Missing or corrupt cache - proceed with check
    }

    // Throttle: skip if checked within 24 hours
    if (cache.lastCheck) {
      const elapsed = Date.now() - new Date(cache.lastCheck).getTime();
      if (elapsed < THROTTLE_MS) {
        process.exit(0);
      }
    }

    // Query npm registry
    const req = https.get(REGISTRY_URL, { timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const latestVersion = data.version;

          if (!latestVersion) {
            process.exit(0);
          }

          // Update cache timestamp
          cache.lastCheck = new Date().toISOString();

          // Compare versions
          if (cache.currentVersion && latestVersion === cache.currentVersion) {
            // Already on latest - just update timestamp
            writeCache(cache);
            process.exit(0);
          }

          // Newer version available (or no cached version) - update in background
          cache.currentVersion = cache.currentVersion || 'unknown';
          writeCache(cache);

          const child = spawn('npm', ['install', '-g', 'get-shit-done-pe@latest'], {
            detached: true,
            stdio: 'ignore'
          });
          child.on('error', (err) => {
            try {
              const errCache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
              errCache.lastError = err.message;
              errCache.lastErrorTime = new Date().toISOString();
              fs.writeFileSync(CACHE_PATH, JSON.stringify(errCache, null, 2) + '\n');
            } catch (e) { /* silent */ }
          });
          child.unref();

          process.exit(0);
        } catch (e) {
          process.exit(0);
        }
      });
    });

    req.on('error', () => process.exit(0));
    req.on('timeout', () => { req.destroy(); process.exit(0); });

  } catch (e) {
    process.exit(0);
  }
});

function writeCache(data) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2) + '\n');
  } catch (e) {
    // Silent - cache write failure is not fatal
  }
}
