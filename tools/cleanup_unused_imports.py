#!/usr/bin/env python3
import re
from pathlib import Path

root = Path('startupspherev2-backend/src/main/java')
if not root.exists():
    print('No java source dir found')
    exit(1)

java_files = list(root.rglob('*.java'))
removed_count = 0
files_changed = []
for path in java_files:
    text = path.read_text(encoding='utf-8')
    lines = text.splitlines()
    import_lines = []
    import_indices = []
    for i,l in enumerate(lines):
        m = re.match(r"\s*import\s+([^;]+);", l)
        if m:
            imp = m.group(1).strip()
            # skip wildcard imports and static imports
            if imp.endswith('.*') or imp.startswith('static '):
                continue
            import_lines.append((i, imp))
            import_indices.append(i)
    if not import_lines:
        continue
    # create content excluding imports section for search
    non_import_content = '\n'.join([ln for idx,ln in enumerate(lines) if idx not in import_indices])
    to_remove = []
    for idx, imp in import_lines:
        # get simple name
        simple = imp.split('.')[-1]
        # If simple name appears in non-import content
        # Use word boundary to avoid partial matches
        if re.search(r"\b"+re.escape(simple)+r"\b", non_import_content):
            continue
        # else mark for removal
        to_remove.append(idx)
    if not to_remove:
        continue
    # backup
    backup = path.with_suffix(path.suffix + '.bak')
    backup.write_text(text, encoding='utf-8')
    # write new file without the to_remove lines
    new_lines = [ln for i,ln in enumerate(lines) if i not in to_remove]
    path.write_text('\n'.join(new_lines)+('\n' if text.endswith('\n') else ''), encoding='utf-8')
    removed_count += len(to_remove)
    files_changed.append((str(path), len(to_remove)))

print(f"Scanned {len(java_files)} java files. Removed {removed_count} unused imports in {len(files_changed)} files.")
for f,c in files_changed:
    print(f"{f}: removed {c}")
