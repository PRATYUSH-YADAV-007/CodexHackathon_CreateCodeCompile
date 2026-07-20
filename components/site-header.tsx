import Link from "next/link";
import { Mark } from "./icons";

export function SiteHeader() {
  return <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
    <Link href="/" className="flex items-center gap-3"><Mark /><span className="text-lg font-bold tracking-tight">CodeCompile</span></Link>
    <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 sm:flex"><a href="#how-it-works">How it works</a><a href="#principles">Our approach</a></nav>
    <Link href="/session" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">Start practicing</Link>
  </header>;
}
