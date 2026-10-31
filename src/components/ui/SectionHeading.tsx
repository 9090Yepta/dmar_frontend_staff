type SectionHeadingProps = {
  eyebrow: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function SectionHeading({ eyebrow, title, children, className = '' }: SectionHeadingProps) {
  return (
    <section className={`section-heading ${className}`.trim()}>
      <div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>
      {children}
    </section>
  );
}
