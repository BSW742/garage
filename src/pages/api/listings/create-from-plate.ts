import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { plate, email } = await request.json();

    if (!plate || !email) {
      return new Response(JSON.stringify({ error: 'Plate and email required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const cleanPlate = plate.toUpperCase().replace(/\s/g, '');

    // Look up plate via Carjam
    const carjamUrl = `https://www.carjam.co.nz/car/?plate=${encodeURIComponent(cleanPlate)}`;
    const carjamResponse = await fetch(carjamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (!carjamResponse.ok) {
      return new Response(JSON.stringify({ error: 'Could not look up vehicle. Check the plate number.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const html = await carjamResponse.text();
    const vehicle = parseCarJamHtml(html, cleanPlate);

    if (!vehicle.make) {
      return new Response(JSON.stringify({ error: 'Vehicle not found. Check the plate number.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate PIN and listing ID
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPin = await hashPin(pin);
    const timestamp = Date.now();
    const id = `${vehicle.make.toLowerCase()}-${vehicle.year || 'unknown'}-${timestamp}`;

    // Get DB from environment
    const { DB } = (locals as any).runtime.env;

    // Check if plate already has a listing
    const existing = await DB.prepare(
      'SELECT id FROM listings WHERE plate = ?'
    ).bind(cleanPlate).first();

    if (existing) {
      return new Response(JSON.stringify({
        error: 'This vehicle is already listed. Use /edit to update it.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create pending listing (no price yet)
    await DB.prepare(`
      INSERT INTO listings (id, plate, make, model, year, kms, colour, price, location, description, photos, seller_email, pin, status, created_at, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, '', '', '[]', ?, ?, 'pending', datetime('now'), 'garage')
    `).bind(
      id,
      cleanPlate,
      vehicle.make,
      vehicle.model,
      vehicle.year || 2020,
      vehicle.kms || 0,
      vehicle.colour || '',
      email,
      hashedPin  // Store hashed PIN
    ).run();

    return new Response(JSON.stringify({
      success: true,
      listing: {
        id,
        plate: cleanPlate,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        kms: vehicle.kms,
        colour: vehicle.colour
      },
      pin
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Create from plate error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create listing' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

function parseCarJamHtml(html: string, plate: string): {
  plate: string;
  make: string;
  model: string;
  year: number | null;
  colour: string;
  kms: number | null;
} {
  const result = {
    plate,
    make: '',
    model: '',
    year: null as number | null,
    colour: '',
    kms: null as number | null
  };

  // Parse from title tag
  const titleMatch = html.match(/<title>[^-]*-[^-]*-\s*(\d{4})\s+([A-Z]+)\s+([A-Z0-9\s]+?)\s+in\s+([^|<]+)/i);
  if (titleMatch) {
    result.year = parseInt(titleMatch[1]);
    result.make = titleMatch[2].charAt(0) + titleMatch[2].slice(1).toLowerCase();
    result.model = titleMatch[3].trim().split(/\s+/).map(w =>
      w.charAt(0) + w.slice(1).toLowerCase()
    ).join(' ');
    result.colour = titleMatch[4].trim();
  }

  // Parse from window.report.idh.vehicle JSON
  const vehicleJsonMatch = html.match(/window\.report\.idh\.vehicle\s*=\s*(\{[^}]+\})/);
  if (vehicleJsonMatch) {
    try {
      const vehicleData = JSON.parse(vehicleJsonMatch[1]);
      if (vehicleData.make && !result.make) {
        result.make = vehicleData.make.charAt(0) + vehicleData.make.slice(1).toLowerCase();
      }
      if (vehicleData.year_of_manufacture && !result.year) {
        result.year = parseInt(vehicleData.year_of_manufacture);
      }
    } catch (e) {
      // JSON parse failed
    }
  }

  // Get odometer from history
  const odometerMatch = html.match(/window\.report\.idh\.odometer_history\s*=\s*\[(\{[^}]+\})/);
  if (odometerMatch) {
    try {
      const odometerData = JSON.parse(odometerMatch[1]);
      if (odometerData.odometer_reading) {
        result.kms = parseInt(odometerData.odometer_reading);
      }
    } catch (e) {
      // JSON parse failed
    }
  }

  return result;
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'garage-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
