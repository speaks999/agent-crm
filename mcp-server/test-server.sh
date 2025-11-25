#!/bin/bash

# Load environment variables from parent .env.local
if [ -f ../.env.local ]; then
  export $(cat ../.env.local | grep -v '^#' | xargs)
fi

# Test tools/list
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
