export interface SandboxResult {
  success: boolean;
  output: unknown;
  error: string | null;
  executionTimeMs: number;
}

export async function executeSandboxed(
  code: string,
  input: unknown,
  timeoutMs: number = 5000,
  _maxMemoryMb: number = 64
): Promise<SandboxResult> {
  const startTime = Date.now();

  return new Promise<SandboxResult>((resolve) => {
    const timer = setTimeout(() => {
      resolve({
        success: false,
        output: null,
        error: `Execution timed out after ${timeoutMs}ms`,
        executionTimeMs: Date.now() - startTime,
      });
    }, timeoutMs);

    try {
      // Wrap skill code in an async function with input available
      const wrappedCode = `
        return (async function() {
          const input = __input__;
          ${code}
        })();
      `;

      const fn = new Function('__input__', wrappedCode);
      const resultPromise = fn(input);

      Promise.resolve(resultPromise)
        .then((output: unknown) => {
          clearTimeout(timer);
          resolve({
            success: true,
            output,
            error: null,
            executionTimeMs: Date.now() - startTime,
          });
        })
        .catch((err: any) => {
          clearTimeout(timer);
          resolve({
            success: false,
            output: null,
            error: err.message || String(err),
            executionTimeMs: Date.now() - startTime,
          });
        });
    } catch (err: any) {
      clearTimeout(timer);
      resolve({
        success: false,
        output: null,
        error: err.message || String(err),
        executionTimeMs: Date.now() - startTime,
      });
    }
  });
}
