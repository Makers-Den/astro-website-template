#!/usr/bin/env node

/**
 * Compare Lighthouse results between baseline (main) and PR
 * Usage: node lh-diff.js <baseline-dir> <pr-dir>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const [, , baselineDir, prDir] = process.argv;

if (!baselineDir || !prDir) {
  console.error('Usage: node lh-diff.js <baseline-dir> <pr-dir>');
  process.exit(1);
}

function readLighthouseResults(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const results = {};

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      const data = JSON.parse(content);
      
      if (!data.requestedUrl || !data.categories) continue;

      // Normalize URL for comparison
      const url = new URL(data.requestedUrl);
      const normalizedUrl = url.pathname;

      results[normalizedUrl] = {
        performance: Math.round(data.categories.performance?.score * 100 || 0),
        accessibility: Math.round(data.categories.accessibility?.score * 100 || 0),
        bestPractices: Math.round(data.categories['best-practices']?.score * 100 || 0),
        seo: Math.round(data.categories.seo?.score * 100 || 0),
      };
    } catch (err) {
      // Skip invalid files
      continue;
    }
  }

  return results;
}

function formatDiff(value1, value2) {
  const diff = value2 - value1;
  if (diff === 0) return `${value2}`;
  if (diff > 0) return `${value2} 🟢 (+${diff})`;
  return `${value2} 🔴 (${diff})`;
}

function generateTable(baseline, pr) {
  const urls = Object.keys(baseline).filter(url => pr[url]);

  if (urls.length === 0) {
    return null;
  }

  let table = '| URL | Metric | Baseline | PR | Change |\n';
  table += '|-----|--------|----------|----|---------|\n';

  for (const url of urls) {
    const b = baseline[url];
    const p = pr[url];

    table += `| ${url} | Performance | ${b.performance} | ${formatDiff(b.performance, p.performance)} | ${p.performance - b.performance} |\n`;
    table += `| | Accessibility | ${b.accessibility} | ${formatDiff(b.accessibility, p.accessibility)} | ${p.accessibility - b.accessibility} |\n`;
    table += `| | Best Practices | ${b.bestPractices} | ${formatDiff(b.bestPractices, p.bestPractices)} | ${p.bestPractices - b.bestPractices} |\n`;
    table += `| | SEO | ${b.seo} | ${formatDiff(b.seo, p.seo)} | ${p.seo - b.seo} |\n`;
  }

  return table;
}

try {
  const baseline = readLighthouseResults(baselineDir);
  const pr = readLighthouseResults(prDir);

  const table = generateTable(baseline, pr);

  if (table) {
    console.log(table);
  } else {
    console.log('_No matching URLs found between baseline and PR_');
  }
} catch (err) {
  console.error('Error comparing Lighthouse results:', err.message);
  process.exit(1);
}
