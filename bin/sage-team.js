#!/usr/bin/env node

/**
 * Sage Team CLI entry point.
 * This file is the bin target for the `sage-team` and `sage` commands.
 * It delegates to the compiled CLI in dist/.
 */

const path = require('path');
const fs = require('fs');

const distCli = path.join(__dirname, '..', 'dist', 'cli.js');

if (!fs.existsSync(distCli)) {
  console.error('Error: Sage Team has not been built yet.');
  console.error('Run: npm run build');
  process.exit(1);
}

require(distCli);
