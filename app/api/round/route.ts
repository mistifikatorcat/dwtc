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

    const { data, error } = await supabase
    .from("cars")
    .select(`id, car_images!inner(storage_path)`)
    .eq("active", true)
    .eq("car_images.active", true);

    if (error) {
        console.error("Error fetching cars:", error);
        return NextResponse.json({ error: "Failed to fetch cars" }, { status: 500 });
    }


    const cars = data as CarWithImages[];

    if (cars.length === 0) {
        return NextResponse.json({ error: "No active cars found" }, { status: 404 });
    }


    const car = cars[Math.floor(Math.random() * cars.length)];

    const image = car.car_images[Math.floor(Math.random() * car.car_images.length)];

    const {
        data: { publicUrl },
    } = supabase.storage.from("car-images").getPublicUrl(image.storage_path);

    return NextResponse.json({ roundId: car.id, imageUrl: publicUrl });
}