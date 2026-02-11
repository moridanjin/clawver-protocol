import { fork } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { v4 as uuid } from 'uuid';

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
  maxMemoryMb: number = 64
): Promise<SandboxResult> {
  const startTime = Date.now();

  // Write the skill code to a temp file with a wrapper
  const tmpFile = path.join(tmpdir(), `clawver-skill-${uuid()}.js`);

  const wrappedCode = `
    const input = ${JSON.stringify(input)};

    async function __run() {
      ${code}
    }

    __run()
      .then(result => {
        process.send({ success: true, output: result });
        process.exit(0);
      })
      .catch(err => {
        process.send({ success: false, error: err.message || String(err) });
        process.exit(1);
      });
  `;

  writeFileSync(tmpFile, wrappedCode, 'utf-8');

  return new Promise<SandboxResult>((resolve) => {
    let resolved = false;

    const child = fork(tmpFile, [], {
      execArgv: [`--max-old-space-size=${maxMemoryMb}`],
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: {}, // empty env — no access to parent secrets
    });

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        child.kill('SIGKILL');
        cleanup();
        resolve({
          success: false,
          output: null,
          error: `Execution timed out after ${timeoutMs}ms`,
          executionTimeMs: Date.now() - startTime,
        });
      }
    }, timeoutMs);

    child.on('message', (msg: any) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        cleanup();
        if (msg.success) {
          resolve({
            success: true,
            output: msg.output,
            error: null,
            executionTimeMs: Date.now() - startTime,
          });
        } else {
          resolve({
            success: false,
            output: null,
            error: msg.error,
            executionTimeMs: Date.now() - startTime,
          });
        }
      }
    });

    child.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        cleanup();
        resolve({
          success: false,
          output: null,
          error: err.message,
          executionTimeMs: Date.now() - startTime,
        });
      }
    });

    child.on('exit', (code) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        cleanup();
        resolve({
          success: false,
          output: null,
          error: `Process exited with code ${code}`,
          executionTimeMs: Date.now() - startTime,
        });
      }
    });

    function cleanup() {
      try { unlinkSync(tmpFile); } catch {}
    }
  });
}
