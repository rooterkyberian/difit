---
name: difit-review
description: Request a human code review via difit. Opens a browser-based diff viewer, blocks until the reviewer clicks "Review Complete", then returns structured comments.
---

Use this skill to request a human code review through difit's `--review` mode.

This skill is designed for coding agents that want a human to review their changes before proceeding. The command blocks until the human finishes reviewing, then outputs structured comments to stdout.

**Prerequisite:** `difit` must be installed globally (`npm install -g difit`).

## Commands

- Review the last commit: `difit --review HEAD~1`
- Review a specific commit range: `difit --review <base-ref> <target-ref>`
- Review uncommitted changes: `difit --review .`
- Review staged changes: `difit --review staged`

## Output Format

When the review is complete, comments are printed to stdout in this format:

```
src/components/Button.tsx:42
This logic needs clarification

src/utils/helper.ts:15-20
Make function name more specific
```

Each comment is a pair of lines:

1. `<file-path>:<line>` or `<file-path>:<start-line>-<end-line>`
2. The comment body (may be multi-line)

Comments are separated by blank lines.

## Incomplete Reviews

If the reviewer closes their browser without clicking "Review Complete", the output includes an incomplete marker:

```
# INCOMPLETE REVIEW - Browser disconnected during review
src/components/Button.tsx:42
This logic needs clarification
```

A warning is also printed to stderr: `WARNING: Review session incomplete - browser disconnected`

## Workflow

1. Run `difit --review HEAD~1` — this opens a browser and blocks
2. Status messages go to stderr so they don't interfere with comment parsing
3. The reviewer views the diff, adds comments, and clicks "Review Complete"
4. Comments are printed to stdout
5. Parse the output and address each comment
6. If no comments are returned, the review passed without feedback

## Example Usage

```bash
review_output=$(difit --review HEAD~1)
if [ -z "$review_output" ]; then
  echo "Review passed with no comments"
elif echo "$review_output" | grep -q "^# INCOMPLETE REVIEW"; then
  echo "Review was interrupted"
else
  echo "Processing review feedback..."
fi
```
