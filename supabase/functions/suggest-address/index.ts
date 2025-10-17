import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AddressSuggestion {
  fullAddress: string;
  city: string;
  street: string;
  house: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query || query.trim().length < 3) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('YANDEX_GEOCODING_API_KEY');
    if (!apiKey) {
      throw new Error('YANDEX_GEOCODING_API_KEY not configured');
    }

    // Call Yandex Geocoding API with results parameter for multiple suggestions
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&geocode=${encodeURIComponent(query)}&format=json&results=10&lang=ru_RU`;
    
    console.log('Requesting Yandex API for suggestions:', query);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Yandex API error: ${response.status}`);
    }

    const data = await response.json();
    const members = data.response?.GeoObjectCollection?.featureMember || [];

    const suggestions: AddressSuggestion[] = members.map((member: any) => {
      const geoObject = member.GeoObject;
      const coordinates = geoObject.Point.pos.split(' ').map(Number);
      const addressComponents = geoObject.metaDataProperty?.GeocoderMetaData?.Address?.Components || [];
      
      // Extract address parts
      let city = '';
      let street = '';
      let house = '';

      addressComponents.forEach((component: any) => {
        switch (component.kind) {
          case 'locality':
            city = component.name;
            break;
          case 'street':
            street = component.name;
            break;
          case 'house':
            house = component.name;
            break;
        }
      });

      return {
        fullAddress: geoObject.metaDataProperty?.GeocoderMetaData?.text || geoObject.name,
        city: city || '',
        street: street || '',
        house: house || '',
        coordinates: {
          lat: coordinates[1],
          lng: coordinates[0],
        },
      };
    });

    console.log(`Found ${suggestions.length} address suggestions`);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in suggest-address function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, suggestions: [] }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});