#!/usr/bin/env node

/**
 * Compare Lighthouse results between baseline (main) and PR
 * Usage: node lh-diff.js <baseline-dir> <pr-dir>
 */

import fs from 'fs';
import path from 'path';

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
  const baselineUrls = Object.keys(baseline);
  const prUrls = Object.keys(pr);
  
  // URLs that exist in both baseline and PR
  const commonUrls = baselineUrls.filter(url => pr[url]);
  
  // URLs that only exist in PR (new pages)
  const newUrls = prUrls.filter(url => !baseline[url]);

  let output = '';

  // Generate comparison table for common URLs
  if (commonUrls.length > 0) {
    output += '### 📊 Compared Pages\n\n';
    output += '| URL | Metric | Baseline | PR | Change |\n';
    output += '|-----|--------|----------|----|---------|\n';

    for (const url of commonUrls) {
      const b = baseline[url];
      const p = pr[url];

      output += `| ${url} | Performance | ${b.performance} | ${formatDiff(b.performance, p.performance)} | ${p.performance - b.performance} |\n`;
      output += `| | Accessibility | ${b.accessibility} | ${formatDiff(b.accessibility, p.accessibility)} | ${p.accessibility - b.accessibility} |\n`;
      output += `| | Best Practices | ${b.bestPractices} | ${formatDiff(b.bestPractices, p.bestPractices)} | ${p.bestPractices - b.bestPractices} |\n`;
      output += `| | SEO | ${b.seo} | ${formatDiff(b.seo, p.seo)} | ${p.seo - b.seo} |\n`;
    }
  }

  // Generate table for new URLs (PR only)
  if (newUrls.length > 0) {
    if (output) output += '\n';
    output += '### ✨ New Pages (PR Only)\n\n';
    output += '| URL | Metric | Score |\n';
    output += '|-----|--------|-------|\n';

    for (const url of newUrls) {
      const p = pr[url];

      output += `| ${url} | Performance | ${p.performance} |\n`;
      output += `| | Accessibility | ${p.accessibility} |\n`;
      output += `| | Best Practices | ${p.bestPractices} |\n`;
      output += `| | SEO | ${p.seo} |\n`;
    }
  }

  return output || null;
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
