import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

import * as vscode from "vscode";

import { Debugger } from "../../debugger";
import { Ruby } from "../../ruby";

suite("Debugger", () => {
  test("Provide debug configurations returns the default configs", () => {
    const context = { subscriptions: [] } as unknown as vscode.ExtensionContext;
    const ruby = { env: {} } as Ruby;
    const debug = new Debugger(context, ruby, "fake");
    const configs = debug.provideDebugConfigurations!(undefined);
    assert.deepEqual(
      [
        {
          type: "ruby_lsp",
          name: "Debug script",
          request: "launch",
          // eslint-disable-next-line no-template-curly-in-string
          program: "ruby ${file}",
        },
        {
          type: "ruby_lsp",
          name: "Debug test",
          request: "launch",
          // eslint-disable-next-line no-template-curly-in-string
          program: "ruby -Itest ${relativeFile}",
        },
        {
          type: "ruby_lsp",
          name: "Attach debugger",
          request: "attach",
        },
      ],
      configs,
    );

    debug.dispose();
  });

  test("Resolve configuration injects Ruby environment", () => {
    const context = { subscriptions: [] } as unknown as vscode.ExtensionContext;
    const ruby = { env: { bogus: "hello!" } } as unknown as Ruby;
    const debug = new Debugger(context, ruby, "fake");
    const configs: any = debug.resolveDebugConfiguration!(undefined, {
      type: "ruby_lsp",
      name: "Debug",
      request: "launch",
      // eslint-disable-next-line no-template-curly-in-string
      program: "ruby ${file}",
    });

    assert.strictEqual(ruby.env, configs.env);
    debug.dispose();
  });

  test("Resolve configuration injects Ruby environment and allows users custom environment", () => {
    const context = { subscriptions: [] } as unknown as vscode.ExtensionContext;
    const ruby = { env: { bogus: "hello!" } } as unknown as Ruby;
    const debug = new Debugger(context, ruby, "fake");
    const configs: any = debug.resolveDebugConfiguration!(undefined, {
      type: "ruby_lsp",
      name: "Debug",
      request: "launch",
      // eslint-disable-next-line no-template-curly-in-string
      program: "ruby ${file}",
      env: { parallel: "1" },
    });

    assert.deepEqual({ parallel: "1", ...ruby.env }, configs.env);
    debug.dispose();
  });

  test("Resolve configuration injects BUNDLE_GEMFILE if there's a custom bundle", () => {
    const tmpPath = fs.mkdtempSync(path.join(os.tmpdir(), "ruby-lsp-test-"));
    fs.mkdirSync(path.join(tmpPath, ".ruby-lsp"));
    fs.writeFileSync(path.join(tmpPath, ".ruby-lsp", "Gemfile"), "hello!");

    const context = { subscriptions: [] } as unknown as vscode.ExtensionContext;
    const ruby = { env: { bogus: "hello!" } } as unknown as Ruby;
    const debug = new Debugger(context, ruby, tmpPath);
    const configs: any = debug.resolveDebugConfiguration!(undefined, {
      type: "ruby_lsp",
      name: "Debug",
      request: "launch",
      // eslint-disable-next-line no-template-curly-in-string
      program: "ruby ${file}",
      env: { parallel: "1" },
    });

    assert.deepEqual(
      {
        parallel: "1",
        ...ruby.env,
        BUNDLE_GEMFILE: `${tmpPath}/.ruby-lsp/Gemfile`,
      },
      configs.env,
    );

    debug.dispose();
    fs.rmSync(tmpPath, { recursive: true, force: true });
  });
});
