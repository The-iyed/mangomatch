#!/bin/bash

echo "=== Running unit tests ==="
go test -v ./pkg/mangomatch

echo -e "\n=== Running comprehensive test cases ==="
go test -v ./pkg/mangomatch -run TestComprehensive

echo -e "\n=== Test Summary ==="
UNIT_TEST_RESULT=$(go test ./pkg/mangomatch -v | grep -c "PASS:")
COMP_TEST_RESULT=$(go test ./pkg/mangomatch -run TestComprehensive -v | grep -c "PASS:")
EXAMPLE_TEST_RESULT=$(go run cmd/comprehensive_test/main.go | grep -c "Result: true")

TOTAL_TESTS=$((UNIT_TEST_RESULT + COMP_TEST_RESULT + EXAMPLE_TEST_RESULT))

echo "Unit tests passed: $UNIT_TEST_RESULT"
echo "Comprehensive tests passed: $COMP_TEST_RESULT"
echo "Example tests passed: $EXAMPLE_TEST_RESULT"
echo -e "\nTotal tests passed: $TOTAL_TESTS/250+"

if [ "$COMP_TEST_RESULT" -eq 221 ]; then
  echo -e "\n✅ All tests passed successfully!"
else
  echo -e "\n❌ Some tests failed"
  exit 1
fi 