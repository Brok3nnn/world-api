/** Whether a transition table allows moving from one status to another. */
export function canTransition<Status extends string>(
  transitions: Readonly<Record<Status, readonly Status[]>>,
  from: Status,
  to: Status,
): boolean {
  return transitions[from].includes(to);
}
