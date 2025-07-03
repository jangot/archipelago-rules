#!/usr/bin/env pwsh
$env:DEBUG_TESTS = "1"
& npx jest @args
