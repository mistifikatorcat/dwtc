import { createSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const supabase = await createSupabaseClient();
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get("id");

    if (!roundId) {
        return new Response(JSON.stringify({ error: "Round ID is required" }), {
            status: 400
        });
    }

    const { data: round, error: roundError } = await supabase
        .from("game_rounds")
        .select("car_image_id")
        .eq("id", roundId)
        .gt("expires_at", new Date().toISOString())
        .single();

    if (roundError || !round) {
        return new Response(JSON.stringify({ error: "Round not found" }), {
            status: 404
        });
    }

    const { data: image, error: imageError } = await supabase
        .from("car-images")
        .select("storage_path")
        .eq("id", round.car_image_id)
        .eq("active", true)
        .single();


        if (imageError || !image) {
        return new Response(JSON.stringify({ error: "Image not found" }), {
            status: 404
        });
    }

    const {data: file, error: fileError} = await supabase.storage
        .from("car-images")
        .download(image.storage_path);

        if (fileError || !file) {
        return new Response(JSON.stringify({ error: "Failed to download image" }), {
            status: 500
        });
    }

    const buffer = await file.arrayBuffer();

    return new Response(buffer, {
        headers: {
            "Content-Type": file.type || "image/jpeg",
            "Cache-Control": "private, max-age=3600,"},
    });
}