#!/usr/bin/env bash
# Splice App.jsx into index.html for in-browser Babel deployment.
# Run this whenever you edit App.jsx, then commit both files and push.
set -euo pipefail

SOURCE="App.jsx"
TARGET="index.html"

if [[ ! -f "$SOURCE" ]]; then
  echo "Error: $SOURCE not found"; exit 1
fi
if [[ ! -f "$TARGET" ]]; then
  echo "Error: $TARGET not found"; exit 1
fi

python3 << 'PYEOF'
with open("App.jsx", "r") as f:
    body = f.read()

# Strip the import line and the export keyword for in-browser Babel
lines = body.split("\n")
lines = [l for l in lines if not l.startswith("import ")]
body = "\n".join(lines).replace("export default function App", "function App")

# Read the existing index.html
with open("index.html", "r") as f:
    shell = f.read()

# Locate the splice region: between the destructuring line and the render call.
# We rebuild this region cleanly every build.
import re
hooks_line = "    const { useState, useEffect, useCallback, useRef } = React;"
render_line = "    const root = ReactDOM.createRoot(document.getElementById(\"root\"));"

start_idx = shell.find(hooks_line)
end_idx = shell.find(render_line)
if start_idx == -1 or end_idx == -1:
    raise SystemExit("Could not locate splice anchors in index.html — has the shell been edited?")

# Indent the body by 4 spaces for readability inside the script tag
indented = "\n".join("    " + line if line.strip() else line for line in body.split("\n"))

new_shell = (
    shell[:start_idx + len(hooks_line)]
    + "\n\n"
    + indented
    + "\n\n"
    + shell[end_idx:]
)

with open("index.html", "w") as f:
    f.write(new_shell)

import os
print(f"Spliced App.jsx -> index.html  ({os.path.getsize('index.html'):,} bytes)")
PYEOF

echo "Done. Now: git add -A && git commit -m 'edit' && git push"
