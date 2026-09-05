"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { mockCars } from "@/data/mockCars";

export default function GameShell() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [score, setScore] = useState(0);

  const car = mockCars[currentIndex];

  function normalize(value: string) {
    return value.trim().toLowerCase();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (result !== null || !guess.trim()) {
      return;
    }

    const normalizedGuess = normalize(guess);

    const validAnswers = [
      `${car.make} ${car.model}`,
      `${car.make} ${car.generation ?? ""}`,
      ...(car.aliases ?? []),
    ].map(normalize);

    const isCorrect = validAnswers.includes(normalizedGuess);

    setResult(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      setScore((currentScore) => currentScore + 1);
    }
  }

  function handleNext() {
    setCurrentIndex((current) => (current + 1) % mockCars.length);
    setGuess("");
    setResult(null);
  }

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm opacity-50">Round</p>
          <p className="font-medium">
            {currentIndex + 1} / {mockCars.length}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm opacity-50">Score</p>
          <p className="font-medium">{score}</p>
        </div>
      </div>

      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-neutral-200">
        <Image
          src={car.image}
          alt="Guess this car"
          fill
          priority
          className="object-cover"
        />
      </div>

      <form onSubmit={handleSubmit} className="mt-6">
        <label className="mb-2 block text-sm font-medium">
          What&apos;s the car?
        </label>

        <div className="flex gap-3">
          <input
            value={guess}
            onChange={(event) => setGuess(event.target.value)}
            disabled={result !== null}
            placeholder="e.g. BMW E39"
            className="min-w-0 flex-1 rounded-xl border border-black/20 px-4 py-3 outline-none focus:border-black"
          />

          {result === null && (
            <button
              type="submit"
              disabled={!guess.trim()}
              className="rounded-xl bg-black px-6 py-3 font-medium text-white disabled:opacity-40"
            >
              Guess
            </button>
          )}
        </div>
      </form>

      {result && (
        <div className="mt-6 rounded-2xl border border-black/10 p-5">
          {result === "correct" ? (
            <p className="text-lg font-semibold">Correct.</p>
          ) : (
            <p className="text-lg font-semibold">Nope.</p>
          )}

          <p className="mt-1 opacity-70">
            {car.make} {car.model}
            {car.generation && ` — ${car.generation}`}
          </p>

          <button
            type="button"
            onClick={handleNext}
            className="mt-4 rounded-xl bg-black px-6 py-3 font-medium text-white"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}