type CardProps = React.ComponentProps<'section'>;

export function Card({ className = '', ...props }: CardProps) {
  return <section className={`auth-card ${className}`.trim()} {...props} />;
}
