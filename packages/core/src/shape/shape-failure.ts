import type { Shape } from "@repo/contracts/api/shape";

/**
 * Why a value could not be rendered in a shape. `shape_unsupported`: the endpoint's output spec
 * does not offer the shape. `missing_field`: the value lacks a field the shape needs.
 */
export interface ShapeFailure {
  readonly code: "shape_unsupported" | "missing_field";
  readonly shape: Shape;
  readonly field?: string;
}
