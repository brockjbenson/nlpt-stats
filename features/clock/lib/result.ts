// The outcome of an action the clock rules can refuse, such as a bust or a
// rebuy. Refusals carry a reason the screen can explain; they aren't errors.
export type Result<T, Reason extends string = string> =
  | { ok: true; value: T }
  | { ok: false; reason: Reason };

export function ok<T>(value: T): { ok: true; value: T } {
  return { ok: true, value };
}

export function fail<Reason extends string>(
  reason: Reason,
): { ok: false; reason: Reason } {
  return { ok: false, reason };
}
