import "react";

declare module "react" {
  /** Allows CSS custom properties (`--name`) in `style` without casting. */
  interface CSSProperties {
    [customProperty: `--${string}`]: string | number | undefined;
  }
}
