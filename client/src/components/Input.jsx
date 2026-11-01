export default function Input({ label, error, id, className = "", ...props }) {
  const inputID = id ?? props.name ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1">
      {label && (
        <label className="label" htmlFor={inputID}>
          {label}
        </label>
      )}

      <input
        id={inputID}
        className={`input w-full ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputID}-error` : undefined}
        {...props}
      />

      {error && (
        <p id={`${inputID}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
