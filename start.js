// ES module wrapper to start the CommonJS server
// Needed because package.json has "type": "module" for Vite
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('./server/index.cjs');
