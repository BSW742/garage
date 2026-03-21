import type { APIRoute } from 'astro';
import { addListing } from '../../lib/listings';

async function fetchCarImage(make: string, model: string, year: number): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${year} ${make} ${model} car`);
    const url = `https://www.google.co.nz/search?q=${query}&tbm=isch&safe=active`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Google Images embeds image URLs in various formats
    // Look for data-src or src attributes with actual image URLs
    const patterns = [
      /\["(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp))[^"]*",\d+,\d+\]/gi,
      /data-src="(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
      /\["(https:\/\/encrypted-tbn[^"]+)"/gi,
    ];

    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const imgUrl = match[1];
        // Skip tiny thumbnails and Google's own assets
        if (imgUrl && !imgUrl.includes('gstatic.com/images') && imgUrl.length < 500) {
          return imgUrl;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch car image:', error);
    return null;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Basic validation
    if (!data.make || !data.model || !data.year || !data.price || !data.location || !data.description || !data.sellerContact?.email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Auto-fetch image if none provided
    if (!data.photos || data.photos.length === 0 || !data.photos[0]) {
      const autoImage = await fetchCarImage(data.make, data.model, data.year);
      if (autoImage) {
        data.photos = [autoImage];
      } else {
        // Fallback placeholder
        data.photos = [`https://placehold.co/800x500/0066ff/white?text=${encodeURIComponent(`${data.year} ${data.make} ${data.model}`)}`];
      }
    }

    const listing = addListing(data);

    return new Response(JSON.stringify({ success: true, listing }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create listing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
