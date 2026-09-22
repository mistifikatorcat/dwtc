import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/server";

const ROUND_TIME_LIMITS: Record<number, number | null> = {
  1: null, // Peaceful
  2: 60,   // Easy
  3: 30,   // Normal
  4: 20,   // Hard
  5: 15,   // Very Hard
  6: 10,   // Nightmare
};

export async function GET(request: Request) {
  const supabase = createSupabaseClient();

  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get("gameId");

  if (!gameId) {
    return NextResponse.json(
      { error: "GAME_ID_REQUIRED" },
      { status: 400 }
    );
  }


  const { data: game, error: gameError } = await supabase
    .from("game_sessions")
    .select("id, difficulty, total_rounds, status")
    .eq("id", gameId)
    .maybeSingle();

  if (gameError) {
    console.error("Failed to load game:", gameError);

    return NextResponse.json(
      { error: "FAILED_TO_LOAD_GAME" },
      { status: 500 }
    );
  }

  if (!game) {
    return NextResponse.json(
      { error: "GAME_NOT_FOUND" },
      { status: 404 }
    );
  }

  if (game.status !== "active") {
    return NextResponse.json(
      { error: "GAME_FINISHED" },
      { status: 409 }
    );
  }


  const { data: openRound, error: openRoundError } = await supabase
    .from("game_rounds")
    .select("id, round_number, expires_at")
    .eq("game_id", gameId)
    .is("result", null)
    .maybeSingle();

  if (openRoundError) {
    console.error("Failed to load open round:", openRoundError);

    return NextResponse.json(
      { error: "FAILED_TO_LOAD_ROUND" },
      { status: 500 }
    );
  }

  if (openRound) {
    return NextResponse.json({
      roundId: openRound.id,
      roundNumber: openRound.round_number,
      totalRounds: game.total_rounds,
      difficulty: game.difficulty,
      expiresAt: openRound.expires_at,
      imageUrl: `/api/image?id=${openRound.id}`,
    });
  }


  const { count: roundCount, error: countError } = await supabase
    .from("game_rounds")
    .select("id", { count: "exact", head: true })
    .eq("game_id", gameId);

  if (countError) {
    console.error("Failed to count rounds:", countError);

    return NextResponse.json(
      { error: "FAILED_TO_COUNT_ROUNDS" },
      { status: 500 }
    );
  }

  const completedRounds = roundCount ?? 0;

  if (completedRounds >= game.total_rounds) {
    return NextResponse.json(
      { error: "GAME_COMPLETE" },
      { status: 409 }
    );
  }

  const roundNumber = completedRounds + 1;


  const { data: previousRounds, error: previousRoundsError } =
    await supabase
      .from("game_rounds")
      .select("car_image_id")
      .eq("game_id", gameId);

  if (previousRoundsError) {
    console.error(
      "Failed to load previous rounds:",
      previousRoundsError
    );

    return NextResponse.json(
      { error: "FAILED_TO_LOAD_PREVIOUS_ROUNDS" },
      { status: 500 }
    );
  }

  const usedImageIds = new Set(
    previousRounds?.map((round) => round.car_image_id) ?? []
  );


  const { data: images, error: imagesError } = await supabase
    .from("car_images")
    .select("id")
    .eq("active", true);

  if (imagesError) {
    console.error("Failed to load images:", imagesError);

    return NextResponse.json(
      { error: "FAILED_TO_LOAD_IMAGES" },
      { status: 500 }
    );
  }

  const availableImages =
    images?.filter((image) => !usedImageIds.has(image.id)) ?? [];

  if (availableImages.length === 0) {
    return NextResponse.json(
      { error: "NO_AVAILABLE_IMAGES" },
      { status: 409 }
    );
  }


  const randomImage =
    availableImages[
      Math.floor(Math.random() * availableImages.length)
    ];


  const durationSeconds =
    ROUND_TIME_LIMITS[game.difficulty] ?? null;

  const expiresAt =
    durationSeconds === null
      ? null
      : new Date(
          Date.now() + durationSeconds * 1000
        ).toISOString();


  const { data: round, error: roundError } = await supabase
    .from("game_rounds")
    .insert({
      game_id: gameId,
      round_number: roundNumber,
      car_image_id: randomImage.id,
      expires_at: expiresAt,
    })
    .select("id, round_number, expires_at")
    .single();

  if (roundError) {
    console.error("Failed to create round:", roundError);

    return NextResponse.json(
      { error: "FAILED_TO_CREATE_ROUND" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    roundId: round.id,
    roundNumber: round.round_number,
    totalRounds: game.total_rounds,
    difficulty: game.difficulty,
    expiresAt: round.expires_at,
    imageUrl: `/api/image?id=${round.id}`,
  });
}