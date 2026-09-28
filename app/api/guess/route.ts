import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/lib/supabase/server";
import { normalizeGuess } from "@/lib/game/normalizeGuess";


export async function POST(request: Request) {
    const supabase = createSupabaseClient();

    const body = await request.json().catch(() => null);


    const roundId = typeof body?.roundId === "string" ? body.roundId : null;
    const rawGuess = typeof body?.guess === "string" ? body.guess : "";


    if (!roundId) {
        return NextResponse.json(
            { error: "ROUND_ID_REQUIRED" },
            { status: 400 }
        );
    }


    const { data: round, error: roundError } = await supabase
        .from("game_rounds")
        .select("id, game_id, round_number, car_image_id, expires_at, result")
        .eq("id", roundId)
        .maybeSingle();


    if (roundError) {
        console.error("Failed to load round:", roundError);

        return NextResponse.json(
            { error: "FAILED_TO_LOAD_ROUND" },
            { status: 500 }
        );
    }

    if (!round) {
        return NextResponse.json(
            { error: "ROUND_NOT_FOUND" },
            { status: 404 }
        );
    }

    if (round.result !== null) {
        return NextResponse.json(
            { error: "ROUND_FINISHED" },
            { status: 409 }
        );
    }

    const { data: image, error: imageError } = await supabase
        .from("car_images")
        .select("car_id")
        .eq("id", round.car_image_id)
        .single();


    if (imageError) {
        console.error("Failed to load image:", imageError);
        return NextResponse.json(
            { error: "FAILED_TO_LOAD_CAR" },
            { status: 500 }
        );
    }
    const { data: car, error: carError } = await supabase
        .from("cars")
        .select("id, make, model, generation, variant")
        .eq("id", image.car_id)
        .single();
    
         if (carError) {
    console.error("Failed to load car:", carError);

    return NextResponse.json(
      { error: "FAILED_TO_LOAD_CAR" },
      { status: 500 }
    );
  }


    const answer = {
        make: car.make,
        model: car.model,
        generation: car.generation,
        variant: car.variant,
    }

    const now = new Date();


    const timedOut = round.expires_at !== null && now.getTime() > new Date(round.expires_at).getTime();


        if (timedOut) {
            const { data: closedRound, error: closeError } = await supabase
                .from("game_rounds")
                .update({
                    answered_at: now.toISOString(),
                    guess: rawGuess.trim() || null,
                    result: "timeout",
                    score_multiplier: 0,
                })
                .eq("id", round.id)
                .is("result", null)
                .select("id")
                .maybeSingle();
                
        
        


        if (closeError) {
            console.error("Failed to update round:", closeError);

            return NextResponse.json(
                { error: "FAILED_TO_UPDATE_ROUND" },
                { status: 500 }
            );
        }


        if (!closedRound) {
            return NextResponse.json(
                { error: "ROUND_ALREADY_CLOSED" },
                { status: 409 }
            );
        }


    return NextResponse.json({
            correct: false,
            result: "TIMEOUT",
            scoreMultiplier: 0,
            feedback: "Too late! The round has expired.",
            answer,
        });
    }

    if (!rawGuess.trim()) {
        return NextResponse.json(
            { error: "GUESS_REQUIRED" },
            { status: 400 }
        );
    }

    const { data: aliases, error: aliasesError } = await supabase
        .from("car_aliases")
        .select("alias, accepted, score_multiplier, feedback")
        .eq("car_id", car.id);

        if (aliasesError) {
            console.error("Failed to load car aliases:", aliasesError);
            return NextResponse.json(
                { error: "FAILED_TO_LOAD_ALIASES" },
                { status: 500 }
            );
        }

        const normalizedGuess = normalizeGuess(rawGuess);

        const canonicalAnswers = [
            `${car.make} ${car.model}`,

            car.generation ? `${car.make} ${car.model} ${car.generation}` : null,
            car.variant ? `${car.make} ${car.model} ${car.variant}` : null,
            car.generation && car.variant ? `${car.make} ${car.model} ${car.generation} ${car.variant}` : null,
        ]
        .filter((value): value is string => typeof value === "string")
        .map(normalizeGuess);


        const canonicalMatch = canonicalAnswers.includes(normalizedGuess);

        const aliasMatch = aliases?.find(
            (alias) => normalizeGuess(alias.alias) === normalizedGuess
        );

        let correct = false;
        let scoreMultiplier = 0;
        let feedback: string | null = null;

        if (canonicalMatch) {
            correct = true;
            scoreMultiplier = 1;
        } else if (aliasMatch) {
            correct = aliasMatch.accepted;
            scoreMultiplier = aliasMatch.score_multiplier ? Number(aliasMatch.score_multiplier) : 0;
            feedback = aliasMatch.feedback ?? null;
        }

        const result = correct ? "correct" : "incorrect";

        const { data: closedRound, error: updateError } = await supabase
            .from("game_rounds")
            .update({
                answered_at: now.toISOString(),
                guess: rawGuess.trim(),
                result,
                score_multiplier: scoreMultiplier,
            })
            .eq("id", round.id)
            .is("result", null)
            .select("id")
            .maybeSingle();

        if (updateError) {
            console.error("Failed to update round:", updateError);

            return NextResponse.json(
                { error: "FAILED_TO_UPDATE_ROUND" },
                { status: 500 }
            );
        }
        if (!closedRound) {
            return NextResponse.json(
                { error: "ROUND_ALREADY_CLOSED" },
                { status: 409 }
            );
        }

        return NextResponse.json({
            correct,
            result,
            scoreMultiplier,
            feedback,
            answer,
        });
}
