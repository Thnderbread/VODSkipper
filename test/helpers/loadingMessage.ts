export default function loadingErrorMsg(
  browserName: string,
  seconds: number,
): string {
  return `[${browserName} browser] still says loading after ${seconds}s.`
}
