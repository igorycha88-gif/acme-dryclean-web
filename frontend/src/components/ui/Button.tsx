import { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonBase {
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = ButtonBase &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };
type ButtonAsLink = ButtonBase &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white rounded-[28px] h-12 px-8 font-[family-name:var(--font-heading)] font-semibold text-[15px] hover:shadow-[0_6px_20px_rgba(232,69,60,0.3)] hover:-translate-y-px transition-all duration-300",
  secondary:
    "bg-transparent text-primary border-2 border-primary rounded-[28px] h-12 px-8 font-[family-name:var(--font-heading)] font-semibold text-[15px] hover:bg-primary hover:text-white transition-all duration-300",
  ghost:
    "text-secondary border-b border-dashed border-secondary hover:text-accent hover:border-accent transition-colors duration-300",
};

export default function Button(props: ButtonProps) {
  const { variant = "primary", className = "", children, ...rest } = props;
  const classes = `${variants[variant]} inline-flex items-center justify-center gap-2 ${className}`;

  if ("href" in props && props.href) {
    return (
      <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
