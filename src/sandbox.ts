import { getQuickJS, shouldInterruptAfterDeadline, QuickJSWASMModule } from 'quickjs-emscripten';

export interface SandboxResult {
  success: boolean;
  output: unknown;
  error: string | null;
  executionTimeMs: number;
}

// Cache the WASM module — expensive to load, reuse across invocations
let cachedModule: QuickJSWASMModule | null = null;

async function getModule(): Promise<QuickJSWASMModule> {
  if (!cachedModule) {
    cachedModule = await getQuickJS();
  }
  return cachedModule;
}

export async function executeSandboxed(
  code: string,
  input: unknown,
  timeoutMs: number = 5000,
  maxMemoryMb: number = 64
): Promise<SandboxResult> {
  const startTime = Date.now();

  try {
    const QuickJS = await getModule();
    const runtime = QuickJS.newRuntime();

    try {
      // Configure resource limits
      runtime.setMemoryLimit(maxMemoryMb * 1024 * 1024);
      runtime.setMaxStackSize(1024 * 1024); // 1MB stack
      runtime.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + timeoutMs));

      const context = runtime.newContext();

      try {
        // Wrap skill code in IIFE so `return` statements work.
        // Input is injected as JSON — no Node.js globals exist in QuickJS.
        const wrappedCode = `(function() {
  const input = ${JSON.stringify(input)};
  ${code}
})();`;

        const result = context.evalCode(wrappedCode);

        if (result.error) {
          const errorVal = context.dump(result.error);
          result.error.dispose();

          const errorMessage =
            typeof errorVal === 'object' && errorVal !== null && 'message' in errorVal
              ? (errorVal as any).message
              : String(errorVal);

          const isTimeout = errorMessage.includes('interrupted');
          const isMemory =
            errorMessage.includes('memory') ||
            errorMessage.includes('allocation') ||
            errorMessage.includes('out of memory');

          return {
            success: false,
            output: null,
            error: isTimeout
              ? `Execution timed out after ${timeoutMs}ms`
              : isMemory
                ? `Memory limit exceeded (${maxMemoryMb}MB)`
                : `Sandbox error: ${errorMessage}`,
            executionTimeMs: Date.now() - startTime,
          };
        }

        let output: unknown = context.dump(result.value);
        result.value.dispose();

        // Skill code often returns JSON.stringify(...) — auto-parse string outputs
        if (typeof output === 'string') {
          try { output = JSON.parse(output); } catch {}
        }

        return {
          success: true,
          output,
          error: null,
          executionTimeMs: Date.now() - startTime,
        };
      } finally {
        context.dispose();
      }
    } finally {
      runtime.dispose();
    }
  } catch (err: any) {
    return {
      success: false,
      output: null,
      error: err.message || String(err),
      executionTimeMs: Date.now() - startTime,
    };
  }
}
