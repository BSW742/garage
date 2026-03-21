import type { APIRoute } from 'astro';
import puppeteer from '@cloudflare/puppeteer';

interface Runtime {
  env: {
    BROWSER: any;
  };
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { url } = await request.json();

    if (!url || !url.includes('trademe.co.nz')) {
      return new Response(JSON.stringify({ error: 'Invalid Trade Me URL' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { BROWSER } = (locals as { runtime: Runtime }).runtime.env;

    if (!BROWSER) {
      return new Response(JSON.stringify({ error: 'Browser rendering not available' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const browser = await puppeteer.launch(BROWSER);
    const page = await browser.newPage();

    // Set viewport for good image quality
    await page.setViewport({ width: 1200, height: 800 });

    // Navigate to the Trade Me listing
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait for images to load
    await page.waitForSelector('img', { timeout: 10000 });

    // Extract image URLs from the page
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs
        .map(img => img.src)
        .filter(src =>
          src.includes('tmcdn.co.nz') ||
          src.includes('photoserver') ||
          src.includes('storage.googleapis.com')
        )
        .filter(src => !src.includes('icon') && !src.includes('logo'));
    });

    await browser.close();

    // Get the first real car photo (usually the main one)
    const mainImage = images.find(img =>
      img.includes('photoserver/full') ||
      img.includes('photoserver/plus') ||
      img.includes('photoserver/large') ||
      img.includes('photoserver/medium')
    ) || images[0];

    if (!mainImage) {
      return new Response(JSON.stringify({ error: 'No images found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Upgrade to full size if possible
    const fullSizeImage = mainImage
      .replace('/medium/', '/full/')
      .replace('/large/', '/full/')
      .replace('/thumb/', '/full/');

    return new Response(JSON.stringify({
      success: true,
      image: fullSizeImage,
      allImages: images.slice(0, 5) // Return up to 5 images
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to scrape images',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
