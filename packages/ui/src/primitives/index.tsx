import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className, ...rest } = props;
  return <button {...rest} className={`ui-button ${className ?? ""}`.trim()} />;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={`ui-input ${className ?? ""}`.trim()} />;
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={`glass-panel rounded-panel border border-app-border ${className ?? ""}`.trim()}>{children}</section>;
}
