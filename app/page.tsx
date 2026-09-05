import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-6xl items-center px-6">
      <div className="max-w-2xl">
        <p className="mb-4 text-sm uppercase tracking-[0.25em] opacity-60">
          Car guessing game
        </p>

        <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
          Dude,
          <br />
          what&apos;s the car?
        </h1>

        <p className="mt-6 max-w-lg text-lg opacity-70">
          Look at the photo, identify the car and prove that the countless
          hours spent staring at Marketplace listings were not wasted.
        </p>

        <Link
          href="/game"
          className="mt-8 inline-block rounded-full bg-black px-8 py-4 font-medium text-white"
        >
          Start game
        </Link>
      </div>
    </main>
  );
}