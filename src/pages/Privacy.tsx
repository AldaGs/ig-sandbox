export default function Privacy() {
  return (
    <article className="prose prose-invert mx-auto max-w-prose p-4 text-sm leading-relaxed">
      <h1 className="text-xl font-semibold">Privacy Policy</h1>
      <p className="text-neutral-400">Last updated: 2026-06-03</p>

      <h2 className="mt-4 font-semibold">What we collect</h2>
      <p>
        ig-sandbox stores an Instagram access token and a copy of your public
        media URLs in your browser's <code>localStorage</code>. We do not run a
        database. Locally uploaded images never leave your device.
      </p>

      <h2 className="mt-4 font-semibold">How we use it</h2>
      <p>
        The access token is used solely to call the Instagram Graph API to
        display your own media inside the sandbox. We do not share, sell, or
        transmit your data to any third party.
      </p>

      <h2 className="mt-4 font-semibold">How to delete your data</h2>
      <p>
        Click "Disconnect Instagram" in the header. This revokes the locally
        stored token and clears any imported media from the app.
      </p>

      <h2 className="mt-4 font-semibold">Contact</h2>
      <p>For questions or data requests, email the app owner.</p>
    </article>
  );
}
