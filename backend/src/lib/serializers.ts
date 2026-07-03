export const serializeDecimal = <T extends Record<string, unknown>>(
  entity: T,
  field: keyof T
): T => ({
  ...entity,
  [field]: Number(entity[field]),
});
