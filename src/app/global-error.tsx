"use client"

// Last-resort boundary when the root layout itself fails. Kept dependency-free and self-styled.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-CA">
      <body style={{ margin: 0, fontFamily: "Georgia, serif", background: "#f8f5ef", color: "#24201b" }}>
        <main style={{ maxWidth: 640, margin: "0 auto", padding: "96px 24px" }}>
          <h1 style={{ fontSize: 40, lineHeight: 1.1, margin: 0 }}>Tabled is having trouble loading.</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 18, lineHeight: 1.6, color: "#5b544b" }}>
            Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 16, height: 44, padding: "0 20px", border: 0, borderRadius: 3, background: "#24201b", color: "#f8f5ef", fontSize: 15, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
