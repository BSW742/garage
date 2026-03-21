import type { APIRoute } from 'astro';
import { getAllListings } from '../lib/listings';

export const GET: APIRoute = async ({ locals }) => {
  const { DB } = (locals as any).runtime.env;
  const listings = await getAllListings(DB);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://garage.co.nz/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://garage.co.nz/about</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://garage.co.nz/sell</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://garage.co.nz/llms.txt</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
${listings.map(listing => `  <url>
    <loc>https://garage.co.nz/cars/${listing.id}</loc>
    <lastmod>${listing.createdAt.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};
