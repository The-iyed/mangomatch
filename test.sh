#!/bin/bash

echo "=== Running unit tests ==="
UNIT_OUTPUT=$(go test -v ./pkg/mangomatch 2>&1)
echo "$UNIT_OUTPUT"

echo -e "\n=== Running comprehensive test cases ==="
COMP_OUTPUT=$(go test -v ./pkg/mangomatch -run TestComprehensive 2>&1)
echo "$COMP_OUTPUT"

echo -e "\n=== Running example tests ==="
EXAMPLE_OUTPUT=$(go run cmd/comprehensive_test/main.go 2>&1)
echo "$EXAMPLE_OUTPUT"

echo -e "\n=== Test Summary ==="
 
UNIT_PASSED=$(echo "$UNIT_OUTPUT" | grep -E "^--- PASS:" | grep -v "TestComprehensive" | wc -l | tr -d ' ')
UNIT_FAILED=$(echo "$UNIT_OUTPUT" | grep -E "^--- FAIL:" | grep -v "TestComprehensive" | wc -l | tr -d ' ')
UNIT_TOTAL=$((UNIT_PASSED + UNIT_FAILED))
 
COMP_PASSED=0
COMP_TOTAL=220
if echo "$COMP_OUTPUT" | grep -q "^--- PASS: TestComprehensive"; then
    COMP_PASSED=220
fi
 
EXAMPLE_PASSED=$(echo "$EXAMPLE_OUTPUT" | grep -c "Result: true")
EXAMPLE_TOTAL=30
 
TOTAL_PASSED=$((UNIT_PASSED + COMP_PASSED + EXAMPLE_PASSED))
TOTAL_TESTS=$((UNIT_TOTAL + COMP_TOTAL + EXAMPLE_TOTAL))

echo "Unit tests: $UNIT_PASSED/$UNIT_TOTAL passed"
echo "Comprehensive tests: $COMP_PASSED/$COMP_TOTAL passed"
echo "Example tests: $EXAMPLE_PASSED/$EXAMPLE_TOTAL passed"
echo -e "\n🎯 Total: $TOTAL_PASSED/$TOTAL_TESTS tests passed"
 
if [ "$TOTAL_PASSED" -eq "$TOTAL_TESTS" ]; then
  echo -e "\n✅ All tests passed successfully!"
  exit 0
else
  echo -e "\n❌ Some tests failed ($((TOTAL_TESTS - TOTAL_PASSED)) failed)"
  exit 1
fi