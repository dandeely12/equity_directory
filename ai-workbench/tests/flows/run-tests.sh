#!/bin/bash

# Flow Tests Runner
# Runs all 8 flow tests using ONLY the cheapest models

echo "=========================================="
echo "Flow Tests - AI Workbench"
echo "Using CHEAPEST models only:"
echo "  - gpt-4o-mini (\$0.00015/\$0.0006 per 1k)"
echo "  - claude-3-haiku (\$0.00025/\$0.00125 per 1k)"
echo "=========================================="
echo ""

# Check if server is running
echo "Checking if server is running on localhost:3000..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✓ Server is running"
else
    echo "✗ Server is NOT running on localhost:3000"
    echo "  Please start the server first: npm run dev"
    exit 1
fi

echo ""
echo "Running tests..."
echo ""

# Run tests
if [ -z "$1" ]; then
    # Run all tests
    npx jest --config=jest.config.js
else
    # Run specific test
    npx jest --config=jest.config.js "$1"
fi

exit_code=$?

echo ""
echo "=========================================="
if [ $exit_code -eq 0 ]; then
    echo "✓ All tests passed!"
else
    echo "✗ Some tests failed"
fi
echo "=========================================="

exit $exit_code
