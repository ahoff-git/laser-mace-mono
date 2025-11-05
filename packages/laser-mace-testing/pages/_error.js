import React from 'react';

// Exposes the full runtime error to the user. Use with caution.
function extractError({ res, err }) {
  const statusCode = res?.statusCode || err?.statusCode || 404;
  const message = err?.message || res?.statusMessage || 'Unknown error';
  const stack = err?.stack;
  return { statusCode, message, stack };
}

export default function ErrorPage({ statusCode, message, stack }) {
  const details = stack ?? message;
  return (
    <main>
      <h1>{statusCode}</h1>
      <pre>{details}</pre>
    </main>
  );
}

ErrorPage.getInitialProps = extractError;

