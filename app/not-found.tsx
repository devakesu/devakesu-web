import Link from 'next/link';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0A0A',
  colorScheme: 'dark',
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] text-neutral-100 px-6">
      <div className="max-w-2xl text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-cyan-400 glitch mb-4" data-text="404">
            404
          </h1>
          <h2 className="text-3xl font-semibold mb-2 uppercase tracking-wider">SYSTEM ERROR</h2>
          <p className="text-neutral-400 mb-6">
            The page you&apos;re looking for has been deleted, moved, or never existed.
          </p>
        </div>

        <div className="space-y-4 font-mono text-sm text-left bg-black/40 border border-neutral-700 p-6 rounded">
          <p className="text-cyan-400">&gt; STATUS: 404_NOT_FOUND</p>
          <p className="text-neutral-300">&gt; POSSIBLE_CAUSES:</p>
          <ul className="list-none pl-4 space-y-1 text-neutral-400">
            <li>· Typo in URL</li>
            <li>· Outdated link</li>
            <li>· Removed content</li>
            <li>· Parallel universe glitch</li>
          </ul>
          <p className="text-cyan-400 mt-4">&gt; SUGGESTED_ACTION: RETURN_HOME</p>
        </div>

        <Link
          href="/"
          className="inline-block mt-8 px-6 py-3 bg-cyan-400 text-neutral-950 font-semibold uppercase tracking-wide hover:bg-cyan-300 transition-colors shadow-[0_0_20px_rgba(0,255,255,0.3)]"
        >
          &lt; Back to Safety
        </Link>
      </div>
    </div>
  );
}
