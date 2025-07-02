#!/bin/sh
export DEBUG_TESTS=1
exec npx jest "$@"
