export function shouldFinalizeForAppState(
  nextState: string,
  isNativeFullscreen: boolean,
): boolean {
  return nextState !== "active" && !isNativeFullscreen;
}

export function needsNewWatchSession(input: {
  sessionStarted: boolean;
  sessionEnded: boolean;
  endingRequested: boolean;
}): boolean {
  return !input.sessionStarted || input.sessionEnded || input.endingRequested;
}
