import { Valimock, type ValimockOptions } from "../../Valimock.js";

/**
 * Build a Valimock instance whose `onWarn` pushes into a captured array.
 * Use when a test needs to assert that a particular warning fires (or doesn't).
 *
 * The returned `warnings` array is the same reference the mocker writes to —
 * inspect it after invoking `mock` to make assertions.
 */
export const captureWarnings = (
  options?: Omit<Partial<ValimockOptions>, `onWarn`>
): {
  mock: Valimock[`mock`];
  warnings: string[];
} => {
  const warnings: string[] = [];
  const mock = new Valimock({ ...options, onWarn: (msg) => warnings.push(msg) }).mock;
  return { mock, warnings };
};
