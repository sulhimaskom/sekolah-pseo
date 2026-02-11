#!/usr/bin/env python3
"""
Standalone test runner for sekolah-pseo Python tests.
Runs without pytest - uses only Python standard library.

Usage:
    python3 tests/run_tests.py              # Run all tests
    python3 tests/run_tests.py -v           # Verbose output
    python3 tests/run_tests.py --json       # JSON output for CI
"""

import os
import sys
import json
import time
import traceback
import argparse
from typing import Dict, List, Any, Optional


class TestResult:
    """Represents a single test result."""
    
    def __init__(self, name: str, passed: bool, duration: float = 0.0, 
                 error: Optional[str] = None):
        self.name = name
        self.passed = passed
        self.duration = duration
        self.error = error
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'name': self.name,
            'passed': self.passed,
            'duration': round(self.duration, 4),
            'error': self.error
        }


class TestSuite:
    """Manages and runs tests."""
    
    def __init__(self):
        self.results: List[TestResult] = []
        self.setup_failed = False
    
    def run_test(self, name: str, test_func, *args, **kwargs) -> TestResult:
        """Run a single test and record result."""
        start = time.time()
        try:
            test_func(*args, **kwargs)
            duration = time.time() - start
            result = TestResult(name, True, duration)
        except Exception as e:
            duration = time.time() - start
            error_msg = f"{type(e).__name__}: {str(e)}"
            result = TestResult(name, False, duration, error_msg)
        
        self.results.append(result)
        return result
    
    def assert_true(self, condition: bool, message: str = ""):
        """Assert that condition is True."""
        if not condition:
            raise AssertionError(message or "Expected True but got False")
    
    def assert_false(self, condition: bool, message: str = ""):
        """Assert that condition is False."""
        if condition:
            raise AssertionError(message or "Expected False but got True")
    
    def assert_equal(self, actual: Any, expected: Any, message: str = ""):
        """Assert that actual equals expected."""
        if actual != expected:
            msg = message or f"Expected {expected!r} but got {actual!r}"
            raise AssertionError(msg)
    
    def assert_in(self, item: Any, container: Any, message: str = ""):
        """Assert that item is in container."""
        if item not in container:
            msg = message or f"Expected {item!r} to be in {container!r}"
            raise AssertionError(msg)
    
    def assert_exists(self, path: str, message: str = ""):
        """Assert that file or directory exists."""
        if not os.path.exists(path):
            msg = message or f"Expected path to exist: {path}"
            raise AssertionError(msg)
    
    def get_summary(self) -> Dict[str, Any]:
        """Get test summary statistics."""
        passed = sum(1 for r in self.results if r.passed)
        failed = len(self.results) - passed
        total_duration = sum(r.duration for r in self.results)
        
        return {
            'total': len(self.results),
            'passed': passed,
            'failed': failed,
            'success_rate': round(passed / len(self.results) * 100, 2) if self.results else 0,
            'total_duration': round(total_duration, 4)
        }


def run_project_structure_tests(suite: TestSuite, root: str) -> None:
    """Run tests for project structure."""
    
    suite.run_test(
        "package.json exists and is valid",
        lambda: suite.assert_true(
            os.path.exists(os.path.join(root, 'package.json')),
            "package.json should exist"
        )
    )
    
    def test_package_json_valid():
        import json
        with open(os.path.join(root, 'package.json'), 'r') as f:
            package = json.load(f)
        suite.assert_equal(package.get('name'), 'sekolah-pseo')
        suite.assert_in('version', package)
    
    suite.run_test("package.json has required fields", test_package_json_valid)
    
    # Test required directories
    required_dirs = ['src', 'scripts', 'data', 'docs']
    for dir_name in required_dirs:
        suite.run_test(
            f"Directory exists: {dir_name}/",
            lambda d=dir_name: suite.assert_true(
                os.path.exists(os.path.join(root, d)),
                f"Required directory {d} should exist"
            )
        )
    
    suite.run_test(
        "schools.csv data file exists",
        lambda: suite.assert_true(
            os.path.exists(os.path.join(root, 'data', 'schools.csv')),
            "schools.csv should exist in data/"
        )
    )


def run_configuration_tests(suite: TestSuite, root: str) -> None:
    """Run tests for configuration."""
    
    suite.run_test(
        ".env.example exists",
        lambda: suite.assert_true(
            os.path.exists(os.path.join(root, '.env.example')),
            ".env.example should exist"
        )
    )
    
    def test_readme_content():
        readme_path = os.path.join(root, 'README.md')
        suite.assert_true(os.path.exists(readme_path), "README.md should exist")
        
        with open(readme_path, 'r') as f:
            content = f.read()
        
        suite.assert_true(len(content) > 100, "README.md should have substantial content")
        suite.assert_in('Sekolah PSEO', content, "README should mention project name")
    
    suite.run_test("README.md exists with content", test_readme_content)


def run_javascript_tests_check(suite: TestSuite, root: str) -> None:
    """Verify JavaScript test files exist."""
    
    scripts_dir = os.path.join(root, 'scripts')
    test_files = [
        'utils.test.js',
        'rate-limiter.test.js',
        'resilience.test.js',
        'PageBuilder.test.js',
    ]
    
    for test_file in test_files:
        suite.run_test(
            f"JS test file exists: {test_file}",
            lambda f=test_file: suite.assert_true(
                os.path.exists(os.path.join(scripts_dir, f)),
                f"Test file {f} should exist"
            )
        )


def run_github_workflows_tests(suite: TestSuite, root: str) -> None:
    """Test GitHub Actions workflow configuration."""
    
    workflows_dir = os.path.join(root, '.github', 'workflows')
    suite.run_test(
        ".github/workflows directory exists",
        lambda: suite.assert_true(
            os.path.exists(workflows_dir),
            ".github/workflows directory should exist"
        )
    )
    
    suite.run_test(
        "on-push.yml workflow exists",
        lambda: suite.assert_true(
            os.path.exists(os.path.join(workflows_dir, 'on-push.yml')),
            "on-push.yml workflow should exist"
        )
    )


def run_data_validation_tests(suite: TestSuite, root: str) -> None:
    """Run data validation tests."""
    
    suite.run_test(
        "external/ directory exists",
        lambda: suite.assert_true(
            os.path.exists(os.path.join(root, 'external')),
            "external/ directory should exist"
        )
    )
    
    def test_dist_directory_creation():
        dist_dir = os.path.join(root, 'dist')
        
        # Clean up if exists
        if os.path.exists(dist_dir):
            import shutil
            shutil.rmtree(dist_dir)
        
        # Try to create
        os.makedirs(dist_dir, exist_ok=True)
        suite.assert_true(os.path.exists(dist_dir), "dist/ directory should be creatable")
        
        # Clean up
        if os.path.exists(dist_dir):
            import shutil
            shutil.rmtree(dist_dir)
    
    suite.run_test("dist/ directory can be created", test_dist_directory_creation)
    
    def test_schools_csv_structure():
        import csv
        data_path = os.path.join(root, 'data', 'schools.csv')
        if not os.path.exists(data_path):
            return  # Skip if no data
        
        with open(data_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        
        if not rows:
            return  # Skip if empty
        
        required_columns = ['npsn', 'nama', 'provinsi', 'kab_kota', 'kecamatan']
        first_row = rows[0]
        
        for col in required_columns:
            suite.assert_in(col, first_row, f"Required column '{col}' should exist")
    
    suite.run_test("schools.csv has required columns", test_schools_csv_structure)


def run_all_tests(root: str) -> TestSuite:
    """Run all tests and return results."""
    suite = TestSuite()
    
    print("=" * 60)
    print("SEKOLAH-PSEO TEST SUITE")
    print("=" * 60)
    print()
    
    # Project Structure Tests
    print("Running Project Structure Tests...")
    run_project_structure_tests(suite, root)
    
    # Configuration Tests
    print("Running Configuration Tests...")
    run_configuration_tests(suite, root)
    
    # JavaScript Tests Check
    print("Running JavaScript Tests Check...")
    run_javascript_tests_check(suite, root)
    
    # GitHub Workflows Tests
    print("Running GitHub Workflows Tests...")
    run_github_workflows_tests(suite, root)
    
    # Data Validation Tests
    print("Running Data Validation Tests...")
    run_data_validation_tests(suite, root)
    
    return suite


def print_results(suite: TestSuite, verbose: bool = False) -> None:
    """Print test results."""
    summary = suite.get_summary()
    
    print()
    print("=" * 60)
    print("TEST RESULTS")
    print("=" * 60)
    
    if verbose:
        for result in suite.results:
            status = "✓ PASS" if result.passed else "✗ FAIL"
            print(f"{status} {result.name} ({result.duration:.4f}s)")
            if result.error:
                print(f"    Error: {result.error}")
    else:
        failed_tests = [r for r in suite.results if not r.passed]
        if failed_tests:
            print("\nFailed Tests:")
            for result in failed_tests:
                print(f"  ✗ {result.name}")
                print(f"    Error: {result.error}")
    
    print()
    print("-" * 60)
    print(f"Total:    {summary['total']}")
    print(f"Passed:   {summary['passed']}")
    print(f"Failed:   {summary['failed']}")
    print(f"Success:  {summary['success_rate']}%")
    print(f"Duration: {summary['total_duration']:.4f}s")
    print("-" * 60)
    
    if summary['failed'] == 0:
        print("✓ All tests passed!")
    else:
        print(f"✗ {summary['failed']} test(s) failed")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description='Run sekolah-pseo Python tests without pytest'
    )
    parser.add_argument('-v', '--verbose', action='store_true',
                        help='Verbose output - show all test results')
    parser.add_argument('--json', action='store_true',
                        help='Output results as JSON')
    parser.add_argument('--exit-code', action='store_true', default=True,
                        help='Exit with non-zero code if tests fail')
    
    args = parser.parse_args()
    
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        suite = run_all_tests(root)
        
        if args.json:
            output = {
                'results': [r.to_dict() for r in suite.results],
                'summary': suite.get_summary()
            }
            print(json.dumps(output, indent=2))
        else:
            print_results(suite, args.verbose)
        
        summary = suite.get_summary()
        if args.exit_code and summary['failed'] > 0:
            sys.exit(1)
        else:
            sys.exit(0)
    
    except Exception as e:
        print(f"Test runner error: {e}", file=sys.stderr)
        traceback.print_exc()
        sys.exit(2)


if __name__ == '__main__':
    main()
