import { createServer } from 'vite';

const script = process.argv[2];
if (!['export-theme-manifests.ts', 'pack-themes.ts'].includes(script)) throw new Error('Unknown theme script');
process.argv.splice(2, 1);
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  await server.ssrLoadModule(`/scripts/${script}`);
} finally {
  await server.close();
}
