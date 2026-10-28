export default function Button({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  onClick,
  className = "",
}) {
  const variants = {
    primary: "btn",
    secondary: "btn btn--secondary",
    danger: "btn btn--danger",
    light: "btn btn--light",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${variants[variant] ?? variants.primary} ${className}`}
    >
      {children}
    </button>
  );
}
