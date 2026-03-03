#!/usr/bin/env node
// AskUserQuestion Guard - PostToolUse hook
// Detects when AskUserQuestion silently returns an empty response (GH #29547)
// and injects a diagnostic into Claude's context to trigger natural recovery.
//
// Root cause: listing AskUserQuestion in allowed-tools routes it through the
// alwaysAllowRules early-return path, skipping UI render entirely.
// Primary fix: remove AskUserQuestion from allowed-tools in all command frontmatter.
// This hook is defense-in-depth for regressions or edge cases.

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const response = JSON.stringify(data.tool_response || '');

    // Detect empty response patterns
    const isEmpty =
      !response ||
      response === '""' ||
      /User has answered your questions:\s*\./.test(response) ||
      /User answered Claude.s questions[^a-zA-Z0-9]*$/.test(response) ||
      /"answers"\s*:\s*\{\s*\}/.test(response);

    if (!isEmpty) {
      process.exit(0);
    }

    // Exit 2 feeds stderr back to Claude as a block reason
    process.stderr.write(
      'AskUserQuestion returned empty (GH #29547 bug). ' +
      'Tell the user the question UI failed and ask them to type their answer directly in chat.'
    );
    process.exit(2);
  } catch (e) {
    // Silent fail — never block on parse errors
    process.exit(0);
  }
});
