type AlertProps = {
  kind: 'error' | 'success';
  children: React.ReactNode;
};

export function Alert({ kind, children }: AlertProps) {
  return <p className={`notice ${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</p>;
}
