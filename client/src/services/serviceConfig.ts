export const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

const configuredHourlyRate = import.meta.env.VITE_DEFAULT_HOURLY_RATE?.trim();
const parsedHourlyRate = Number(configuredHourlyRate);

export const defaultHourlyRate =
  configuredHourlyRate && Number.isFinite(parsedHourlyRate) && parsedHourlyRate >= 0
    ? parsedHourlyRate
    : 100;
