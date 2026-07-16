#!/bin/bash
echo "Hooks in App.tsx:"
grep -E "^\s*(const|let|var)\s+\[.*\]\s*=\s*useState" src/App.tsx | wc -l
echo "useEffects in App.tsx:"
grep "useEffect(" src/App.tsx | wc -l
