export function Loading() {
  return <p className="text-sm text-ink-soft">Loading...</p>;
}

export function ErrorMessage({ message }) {
  return (
    <p className="text-sm font-bold text-red-700" role="alert">
      {message}
    </p>
  );
}
