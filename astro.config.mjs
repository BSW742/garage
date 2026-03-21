import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://garage.co.nz',
  output: 'server',
  adapter: cloudflare(),
  server: {
    port: 4500
  }
});
