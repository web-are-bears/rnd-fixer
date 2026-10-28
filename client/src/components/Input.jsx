export default function Input({ label, error, id, className = "", ...props }) {
  const inputId = id ?? props.name ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1">
      {label && (
        <label className="label" htmlFor={inputId}>
          {label}
        </label>
      )}

      <input
        id={inputId}
        className={`input w-full ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />

      {error && (
        <p id={`${inputId}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
