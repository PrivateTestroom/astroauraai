// Convenience barrel + shared birth-input helpers.
export * from "./constants";
export * from "./positions";
export * from "./parashara";
export * from "./kp";
export * from "./hellenistic";
export * from "./panchang";
export * from "./ashtakoot";

export type BirthData = {
  year: number; month: number; day: number;
  hour: number; minute: number;
  lat: number; lon: number; timeKnown: boolean;
};

/** Convert IST local birth time to a UTC Date. */
export function birthToUtcDate(b: BirthData): Date {
  return new Date(Date.UTC(b.year, b.month - 1, b.day, b.hour - 5, b.minute - 30));
}