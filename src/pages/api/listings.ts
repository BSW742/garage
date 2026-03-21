import type { APIRoute } from 'astro';
import { addListing } from '../../lib/listings';

interface Runtime {
  env: {
    DB: D1Database;
  };
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
}

async function fetchCarImageFromWikipedia(make: string, model: string): Promise<string | null> {
  try {
    // Search Wikipedia for the car model
    const searchQuery = encodeURIComponent(`${make} ${model} car`);
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${searchQuery}&format=json&origin=*`;

    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const firstResult = searchData?.query?.search?.[0];
    if (!firstResult) return null;

    // Get the page images
    const pageTitle = encodeURIComponent(firstResult.title);
    const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${pageTitle}&prop=pageimages&format=json&pithumbsize=800&origin=*`;

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) return null;

    const imageData = await imageRes.json();
    const pages = imageData?.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as any;
    if (page?.thumbnail?.source) {
      return page.thumbnail.source;
    }

    return null;
  } catch (error) {
    return null;
  }
}

async function fetchCarImageFromGoogle(make: string, model: string, year: number): Promise<string | null> {
  try {
    // More specific query to get actual car exterior photos
    const query = encodeURIComponent(`${year} ${make} ${model} exterior photo -interior -engine -dashboard`);
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

    // Look for image URLs - prefer larger images
    const patterns = [
      /\["(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp))",\d{3,},\d{3,}\]/gi,  // Images with dimensions 100+
      /\["(https:\/\/encrypted-tbn[^"]+)"/gi,
    ];

    for (const pattern of patterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const imgUrl = match[1];
        // Skip Google's own assets and tiny images
        if (imgUrl &&
            !imgUrl.includes('gstatic.com/images') &&
            !imgUrl.includes('google.com') &&
            imgUrl.length < 500) {
          return imgUrl;
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

async function fetchCarImage(make: string, model: string, year: number): Promise<string | null> {
  // Try Wikipedia first (most reliable for car images)
  const wikiImage = await fetchCarImageFromWikipedia(make, model);
  if (wikiImage) return wikiImage;

  // Fall back to Google Images
  const googleImage = await fetchCarImageFromGoogle(make, model, year);
  if (googleImage) return googleImage;

  return null;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { DB } = (locals as { runtime: Runtime }).runtime.env;
    const data = await request.json();

    // Basic validation (price can be 0 for stub listings)
    if (!data.make || !data.model || !data.year || data.price === undefined || !data.location || !data.description || !data.sellerContact?.email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Set default source if not provided
    if (!data.source) {
      data.source = 'garage';
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

    const listing = await addListing(DB, data);

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
