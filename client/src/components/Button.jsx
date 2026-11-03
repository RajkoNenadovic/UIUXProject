export function Button({ children, variant = 'secondary', type = 'button', ...props }) {
  return (
    <button className={`button button-${variant}`} type={type} {...props}>
      {children}
    </button>
  );
}
