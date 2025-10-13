import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const geocodingApiKey = Deno.env.get('YANDEX_GEOCODING_API_KEY');
    
    if (!geocodingApiKey) {
      console.error('YANDEX_GEOCODING_API_KEY is not set');
      return null;
    }

    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${geocodingApiKey}&geocode=${encodeURIComponent(address)}&format=json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Geocoding API error:", response.statusText);
      return null;
    }

    const data = await response.json();
    
    const geoObject = data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
    if (!geoObject) {
      console.error("No geocoding results found for:", address);
      return null;
    }

    const coords = geoObject.Point.pos.split(" ");
    const lng = parseFloat(coords[0]);
    const lat = parseFloat(coords[1]);

    return { lat, lng };
  } catch (error) {
    console.error("Failed to geocode address:", error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting geocoding of existing tasks...");

    // Get all tasks without location but with address
    const { data: tasks, error: fetchError } = await supabase
      .from('tasks')
      .select('id, address')
      .is('location', null)
      .not('address', 'is', null);

    if (fetchError) {
      throw new Error(`Failed to fetch tasks: ${fetchError.message}`);
    }

    console.log(`Found ${tasks?.length || 0} tasks to geocode`);

    const results = {
      success: 0,
      failed: 0,
      total: tasks?.length || 0,
      failedTasks: [] as any[],
    };

    if (!tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: "No tasks to geocode",
          results 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Geocode each task
    for (const task of tasks) {
      console.log(`Geocoding task ${task.id}: ${task.address}`);
      
      const coordinates = await geocodeAddress(task.address);
      
      if (coordinates) {
        const location = `POINT(${coordinates.lng} ${coordinates.lat})`;
        
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ location })
          .eq('id', task.id);

        if (updateError) {
          console.error(`Failed to update task ${task.id}:`, updateError);
          results.failed++;
          results.failedTasks.push({ id: task.id, address: task.address, error: updateError.message });
        } else {
          console.log(`Successfully geocoded task ${task.id}`);
          results.success++;
        }
      } else {
        console.error(`Failed to geocode task ${task.id}`);
        results.failed++;
        results.failedTasks.push({ id: task.id, address: task.address, error: "Geocoding failed" });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log("Geocoding complete:", results);

    return new Response(
      JSON.stringify({ 
        message: "Geocoding complete",
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in geocode-existing-tasks:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
