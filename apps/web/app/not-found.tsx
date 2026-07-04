import Link from 'next/link';

/** Root 404 (paths outside any locale). Locale-aware 404 lives in app/[locale]. */
export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'grid',
          placeItems: 'center',
          minHeight: '100vh',
          margin: 0,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 48, margin: 0 }}>404</h1>
          <p style={{ color: '#5E6876' }}>Page not found.</p>
          <Link href="/en" style={{ color: '#9A6A00', fontWeight: 600 }}>
            Go to ALTAN Trading House
          </Link>
        </div>
      </body>
    </html>
  );
}
