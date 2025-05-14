#!/bin/bash

echo "=== Running unit tests ==="
go test -v ./pkg/mangomatch

echo -e "\n=== Running comprehensive test cases ==="
go run cmd/comprehensive_test/main.go | grep -A 1 "Result:"

echo -e "\n=== Test Summary ==="
UNIT_TEST_RESULT=$(go test ./pkg/mangomatch -v | grep -c "PASS:")
COMP_TEST_RESULT=$(go run cmd/comprehensive_test/main.go | grep -c "Result: true")

echo "Unit tests passed: $UNIT_TEST_RESULT"
echo "Comprehensive tests passed: $COMP_TEST_RESULT/30"

if [ "$COMP_TEST_RESULT" -eq 30 ]; then
  echo -e "\n✅ All tests passed successfully!"
else
  echo -e "\n❌ Some tests failed"
  exit 1
fi 