import  { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createSupabaseClient();

  try {
    const  body  = await request.json().catch(() => ({}));

    const difficulty = body.difficulty ?? 3


    if (
        !Number.isInteger(difficulty) ||
        difficulty < 1 ||
        difficulty > 6
    ) {
        return NextResponse.json(
            { error: "Invalid difficulty level." },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from("game_sessions")
        .insert({ difficulty, total_rounds: 5 })
        .select("id, difficulty, total_rounds")
        .single();

        if (error) {
        console.error("Error creating game session:", error);
        return NextResponse.json(
            { error: "Failed to create game session." },
            { status: 500 }
        );
    }

    return NextResponse.json({
        gameid: data.id,
        difficulty: data.difficulty,
        total_rounds: data.total_rounds,
    }, { status: 201 });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json(
            { error: "An unexpected error occurred." },
            { status: 500 }
        );
    }
}