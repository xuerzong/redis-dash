export const cn = (...args: (string | undefined)[]) =>
  args.filter(Boolean).join(' ')
