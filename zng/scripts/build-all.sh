#!/bin/bash

# Ensure the script fails on errors
set -e

# List all app directories
appDirs=( $(ls -1p apps/ | grep / | sed 's/^\(.*\)\//\1/') )

echo "Building all apps ..."

# Function to get the current timestamp in milliseconds using Node.js
get_timestamp() {
  node -e "console.log(Date.now())"
}

echo "Cleaning build directory ..."
start_time=$(get_timestamp)
npm run build clean > /dev/null 2>&1
end_time=$(get_timestamp)
elapsed=$((end_time - start_time))
echo "Cleaned build directory in $elapsed ms"
echo ""

for app in "${appDirs[@]}"
do
  echo "Building $app ..."
  start_time=$(get_timestamp)
  npm run build $app > /dev/null 2>&1
  end_time=$(get_timestamp)
  elapsed=$((end_time - start_time))
  echo "$app App Built in $elapsed ms"
  echo ""
done

echo "Build all completed"
