import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { address } = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const geocodingApiKey = Deno.env.get('YANDEX_GEOCODING_API_KEY');
    
    if (!geocodingApiKey) {
      console.error('YANDEX_GEOCODING_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'Geocoding service configuration error' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Geocoding address: ${address}`);

    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${geocodingApiKey}&geocode=${encodeURIComponent(address)}&format=json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Yandex Geocoding API error:", response.status, response.statusText);
      return new Response(
        JSON.stringify({ 
          error: 'Geocoding API request failed',
          details: response.statusText 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    
    const geoObject = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
    
    if (!geoObject) {
      console.log(`No geocoding results found for address: ${address}`);
      return new Response(
        JSON.stringify({ 
          error: 'Address not found',
          message: 'Не удалось найти указанный адрес. Проверьте правильность написания.' 
        }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const coords = geoObject.Point.pos.split(" ");
    const lng = parseFloat(coords[0]);
    const lat = parseFloat(coords[1]);

    console.log(`Successfully geocoded: ${address} -> [${lat}, ${lng}]`);

    return new Response(
      JSON.stringify({ lat, lng }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in geocode-address function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
