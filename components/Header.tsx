import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-black/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-bold">
          Dude, What&apos;s the Car?
        </Link>

        <nav className="flex gap-6 text-sm">
          <Link href="/">Home</Link>
          <Link href="/game">Play</Link>
        </nav>
      </div>
    </header>
  );
}