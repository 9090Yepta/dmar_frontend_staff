import type { ReactNode } from "react";
import { SectionHeading } from "../../../components/ui/SectionHeading";

export function AdminSectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <SectionHeading eyebrow={`ADMIN · ${eyebrow}`} title={title}>
      {children}
    </SectionHeading>
  );
}
