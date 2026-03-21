import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const plate = url.searchParams.get('plate')?.toUpperCase().replace(/\s/g, '');

  if (!plate) {
    return new Response(JSON.stringify({ error: 'Plate number required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const carjamUrl = `https://www.carjam.co.nz/car/?plate=${encodeURIComponent(plate)}`;
    const response = await fetch(carjamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Vehicle not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const html = await response.text();

    // Parse vehicle data from CarJam HTML
    const vehicle = parseCarJamHtml(html, plate);

    if (!vehicle.make) {
      return new Response(JSON.stringify({ error: 'Could not parse vehicle data' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(vehicle), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch vehicle data' }), {
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
  engineSize: string;
  fuelType: string;
  bodyStyle: string;
  colour: string;
  vin: string;
  kms: number | null;
} {
  const result = {
    plate,
    make: '',
    model: '',
    year: null as number | null,
    engineSize: '',
    fuelType: '',
    bodyStyle: '',
    colour: '',
    vin: '',
    kms: null as number | null
  };

  // Extract make - look for pattern like "Mitsubishi" in title or heading
  const makeMatch = html.match(/<h1[^>]*>.*?(\d{4})\s+([A-Za-z]+)\s+([A-Za-z0-9\s-]+)/i);
  if (makeMatch) {
    result.year = parseInt(makeMatch[1]);
    result.make = makeMatch[2];
    result.model = makeMatch[3].trim();
  }

  // Alternative: look for make in meta or structured data
  const yearMatch = html.match(/Year[:\s]*<[^>]*>(\d{4})/i) || html.match(/"vehicleModelDate":\s*"(\d{4})"/);
  if (yearMatch && !result.year) {
    result.year = parseInt(yearMatch[1]);
  }

  const makeAlt = html.match(/Make[:\s]*<[^>]*>([^<]+)/i) || html.match(/"brand"[^}]*"name":\s*"([^"]+)"/);
  if (makeAlt && !result.make) {
    result.make = makeAlt[1].trim();
  }

  const modelAlt = html.match(/Model[:\s]*<[^>]*>([^<]+)/i) || html.match(/"model":\s*"([^"]+)"/);
  if (modelAlt && !result.model) {
    result.model = modelAlt[1].trim();
  }

  // Engine
  const engineMatch = html.match(/(\d[,\d]*)\s*cc/i);
  if (engineMatch) {
    result.engineSize = engineMatch[1].replace(',', '') + 'cc';
  }

  // Fuel type
  if (html.toLowerCase().includes('diesel')) {
    result.fuelType = 'Diesel';
  } else if (html.toLowerCase().includes('petrol')) {
    result.fuelType = 'Petrol';
  } else if (html.toLowerCase().includes('electric')) {
    result.fuelType = 'Electric';
  } else if (html.toLowerCase().includes('hybrid')) {
    result.fuelType = 'Hybrid';
  }

  // Body style
  const bodyMatch = html.match(/Body Style[:\s]*<[^>]*>([^<]+)/i);
  if (bodyMatch) {
    result.bodyStyle = bodyMatch[1].trim();
  }

  // Colour
  const colourMatch = html.match(/Colour[s]?[:\s]*<[^>]*>([^<]+)/i);
  if (colourMatch) {
    result.colour = colourMatch[1].trim();
  }

  // VIN
  const vinMatch = html.match(/VIN[:\s]*<[^>]*>([A-HJ-NPR-Z0-9]{17})/i) || html.match(/"vin":\s*"([A-HJ-NPR-Z0-9]{17})"/i);
  if (vinMatch) {
    result.vin = vinMatch[1];
  }

  // Odometer - look for most recent reading
  const odometerMatch = html.match(/(\d{1,3}(?:,\d{3})*)\s*km/i);
  if (odometerMatch) {
    result.kms = parseInt(odometerMatch[1].replace(/,/g, ''));
  }

  return result;
}
