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
    const vehicle = parseCarJamHtml(html, plate);

    if (!vehicle.make) {
      return new Response(JSON.stringify({ error: 'Vehicle not found' }), {
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

  // Method 1: Parse from title tag
  // Format: "Report - ABC123 - 1997 MITSUBISHI DELICA in Green with Grey"
  const titleMatch = html.match(/<title>[^-]*-[^-]*-\s*(\d{4})\s+([A-Z]+)\s+([A-Z0-9\s]+?)\s+in\s+([^|<]+)/i);
  if (titleMatch) {
    result.year = parseInt(titleMatch[1]);
    result.make = titleMatch[2].charAt(0) + titleMatch[2].slice(1).toLowerCase();
    result.model = titleMatch[3].trim().split(/\s+/).map(w =>
      w.charAt(0) + w.slice(1).toLowerCase()
    ).join(' ');
    result.colour = titleMatch[4].trim();
  }

  // Method 2: Parse from window.report.idh.vehicle JSON
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
      // JSON parse failed, continue with other methods
    }
  }

  // Method 3: Parse from h1 links
  // <a href="/pedia/?m=MITSUBISHI">MITSUBISHI</a>
  // <a href="/pedia/?m=MITSUBISHI&mo=DELICA">DELICA</a>
  if (!result.make) {
    const makeMatch = html.match(/href="\/pedia\/\?m=([A-Z]+)"[^>]*>\s*<nobr>([A-Z]+)<\/nobr>/i);
    if (makeMatch) {
      result.make = makeMatch[2].charAt(0) + makeMatch[2].slice(1).toLowerCase();
    }
  }

  if (!result.model) {
    const modelMatch = html.match(/href="\/pedia\/\?m=[A-Z]+&mo=([A-Z0-9]+)"[^>]*>.*?<span[^>]*>([A-Z0-9\s]+)<\/span>/i);
    if (modelMatch) {
      result.model = modelMatch[2].trim().split(/\s+/).map(w =>
        w.charAt(0) + w.slice(1).toLowerCase()
      ).join(' ');
    }
  }

  // Get odometer from the odometer history (most recent reading)
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
