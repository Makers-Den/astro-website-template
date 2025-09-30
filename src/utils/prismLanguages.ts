// Preload Prism languages to avoid dynamic require() in Cloudflare Workers
// This ensures @astrojs/prism doesn't invoke the CommonJS loader.

import 'prismjs';

// // Core markup and templating helpers
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-markup-templating';

// // Common languages used across the site
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';

export {};
