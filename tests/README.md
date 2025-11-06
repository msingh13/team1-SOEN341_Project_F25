# Sprint 3 — Acceptance Test Pack

This folder defines manual acceptance tests for Sprint 3 user stories.  
If every step in a story passes without issues, the story is **accepted**.

How to use:
1) Open each `*.md` file during the demo.
2) Read the scenario name and perform the steps exactly as written.
3) Check the expected results after each step.
4) Log any deviation as a bug (out of scope for the demo, but noted).

Optional smoke (backend):
- Set API base: `export API=http://localhost:4000`
- Run: `bash 90-smoke-api.sh` (requires `jq`)
