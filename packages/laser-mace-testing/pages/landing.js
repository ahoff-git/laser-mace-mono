import Link from 'next/link';

export default function Landing() {
  return (
    <div className="container">
      <h1>Welcome</h1>
      <nav>
        <Link href="/play-runner">Play Runner</Link>
      </nav>
      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-family: Arial, sans-serif;
        }
        nav {
          margin-top: 1rem;
        }
        a {
          color: #0070f3;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
