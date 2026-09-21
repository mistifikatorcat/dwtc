import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/server";

type CarWithImages = {
    id: number;
    car_images: {
        storage_path: string;
    }[];
};

export async function GET() {
    const supabase = createSupabaseClient();

    const { data: images, error: imagesError } = await supabase
    .from("car_images")
    .select(`id`)
    .eq("active", true)

    if (imagesError) {
        console.error("Error fetching cars:", imagesError);
        return NextResponse.json({ error: "Failed to fetch cars" }, { status: 500 });
    }


    if (!images || images.length === 0) {
        return NextResponse.json({ error: "No cars found" }, { status: 404 });
    }

    const randomImage = images[Math.floor(Math.random() * images.length)];

    const { data: round, error: roundError } = await supabase
        .from("game_rounds")
        .insert({ car_image_id: randomImage.id })
        .select("id")
        .single();

    if (roundError || !round) {
        console.error("Error creating game round:", roundError);
        return NextResponse.json({ error: "Failed to create game round" }, { status: 500 });
    }



    return NextResponse.json({ roundId: round.id, imageUrl: `/api/image?id=${round.id}` });
}