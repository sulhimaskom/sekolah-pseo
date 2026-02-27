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
import csv
import traceback
import argparse
from typing import Dict, List, Any, Optional
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


# Indonesia geographic bounds (from scripts/config.js)
INDONESIA_LAT_MIN = -11
INDONESIA_LAT_MAX = 6
INDONESIA_LON_MIN = 95
INDONESIA_LON_MAX = 141


def run_functional_data_tests(suite: TestSuite, root: str) -> None:
    """Run functional data validation tests beyond basic structure.
    
    These tests validate actual data quality:
    - ETL output validation
    - CSV schema completeness
    - Coordinate bounds checking
    - NPSN uniqueness
    - Field completeness metrics
    """
    data_path = os.path.join(root, 'data', 'schools.csv')
    
    # Test 1: ETL Output Validation
    def test_etl_output_exists():
        suite.assert_exists(data_path, "schools.csv should exist after ETL")
    
    suite.run_test("ETL output file exists", test_etl_output_exists)
    
    def test_etl_output_has_content():
        if not os.path.exists(data_path):
            return
        with open(data_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            rows = list(reader)
        suite.assert_true(len(rows) > 1, f"schools.csv should have data rows, found {len(rows)}")
    
    suite.run_test("ETL output has content", test_etl_output_has_content)
    
    # Test 2: CSV Schema Validation
    def test_csv_all_required_columns():
        if not os.path.exists(data_path):
            return
        with open(data_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames or []
        required_cols = ['npsn', 'nama', 'bentuk_pendidikan', 'status', 
                        'alamat', 'kelurahan', 'kecamatan', 'kab_kota', 
                        'provinsi', 'lat', 'lon', 'updated_at']
        for col in required_cols:
            suite.assert_in(col, headers, f"Required column '{col}' should exist")
    
    suite.run_test("CSV has all required columns", test_csv_all_required_columns)
    
    def test_csv_lat_lon_numeric():
        if not os.path.exists(data_path):
            return
        with open(data_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        if not rows:
            return
        for row in rows[:10]:
            lat = row.get('lat', '').strip()
            lon = row.get('lon', '').strip()
            if lat:
                try:
                    float(lat)
                except ValueError:
                    suite.assert_true(False, f"lat '{lat}' should be numeric")
            if lon:
                try:
                    float(lon)
                except ValueError:
                    suite.assert_true(False, f"lon '{lon}' should be numeric")
    
    suite.run_test("CSV lat/lon are numeric", test_csv_lat_lon_numeric)
    
    # Test 3: Coordinate Bounds Validation
    def test_coordinates_within_indonesia_bounds():
        if not os.path.exists(data_path):
            return
        with open(data_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        if not rows:
            return
        invalid_coords = []
        for row in rows:
            lat_str = row.get('lat', '').strip()
            lon_str = row.get('lon', '').strip()
            if lat_str and lon_str:
                try:
                    lat = float(lat_str)
                    lon = float(lon_str)
                    if not (INDONESIA_LAT_MIN <= lat <= INDONESIA_LAT_MAX):
                        invalid_coords.append(f"lat {lat} out of bounds")
                    if not (INDONESIA_LON_MIN <= lon <= INDONESIA_LON_MAX):
                        invalid_coords.append(f"lon {lon} out of bounds")
                except ValueError:
                    pass
        total_with_coords = sum(1 for r in rows if r.get('lat') and r.get('lon'))
        if invalid_coords:
            invalid_count = len(invalid_coords)
            suite.assert_true(
                invalid_count <= total_with_coords * 0.05,
                f"Too many invalid coordinates: {invalid_count}/{total_with_coords}. "
                f"Sample: {invalid_coords[:5]}"
            )
    
    suite.run_test("Coordinates within Indonesia bounds", test_coordinates_within_indonesia_bounds)
    
    # Test 4: NPSN Uniqueness
    def test_npsn_uniqueness():
        if not os.path.exists(data_path):
            return
        with open(data_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        if not rows:
            return
        npsn_values = []
        for row in rows:
            npsn = row.get('npsn', '').strip()
            if npsn:
                npsn_values.append(npsn)
        unique_npsn = set(npsn_values)
        duplicates = len(npsn_values) - len(unique_npsn)
        total_npsn = len(npsn_values)
        if duplicates > 0:
            dup_pct = (duplicates / total_npsn) * 100 if total_npsn > 0 else 0
            suite.assert_true(
                dup_pct <= 1.0,
                f"Found {duplicates} duplicate NPSN values ({dup_pct:.2f}% of total)"
            )
    
    suite.run_test("NPSN values are unique", test_npsn_uniqueness)
    
    # Test 5: Field Completeness
    def test_required_fields_not_empty():
        if not os.path.exists(data_path):
            return
        with open(data_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        if not rows:
            return
        required_fields = ['npsn', 'nama', 'provinsi', 'kab_kota']
        empty_counts = {field: 0 for field in required_fields}
        for row in rows:
            for field in required_fields:
                value = row.get(field, '').strip()
                if not value:
                    empty_counts[field] += 1
        total_rows = len(rows)
        for field, empty_count in empty_counts.items():
            empty_pct = (empty_count / total_rows) * 100 if total_rows > 0 else 0
            suite.assert_true(
                empty_pct <= 10.0,
                f"Field '{field}' has {empty_count} empty values ({empty_pct:.2f}%)"
            )
    
    suite.run_test("Required fields have data", test_required_fields_not_empty)
    
    # Test 6: NPSN is Numeric
    def test_npsn_is_numeric():
        if not os.path.exists(data_path):
            return
        with open(data_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        if not rows:
            return
        non_numeric_npsn = []
        for row in rows:
            npsn = row.get('npsn', '').strip()
            if npsn and not npsn.isdigit():
                non_numeric_npsn.append(npsn)
        total_npsn = len(rows)
        non_numeric_count = len(non_numeric_npsn)
        non_numeric_pct = (non_numeric_count / total_npsn) * 100 if total_npsn > 0 else 0
        suite.assert_true(
            non_numeric_pct <= 1.0,
            f"Found {non_numeric_count} non-numeric NPSN values ({non_numeric_pct:.2f}% of total). "
            f"Sample: {non_numeric_npsn[:5]}"
        )
    
    suite.run_test("NPSN values are numeric", test_npsn_is_numeric)
    
    # Test 7: Error Handling
    def test_handles_malformed_csv():
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, 
                                        encoding='utf-8') as f:
            f.write("npsn,nama\n")
            f.write("valid,valid\n")
            f.write("invalid row without proper csv\n")
            temp_path = f.name
        try:
            with open(temp_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                rows = list(reader)
            suite.assert_true(len(rows) >= 1, "Should parse at least 1 valid row")
        finally:
            os.unlink(temp_path)
    
    suite.run_test("Handles malformed CSV gracefully", test_handles_malformed_csv)


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
    
    # Functional Data Tests (Issue #294 - Expanded Python test coverage)
    print("Running Functional Data Tests...")
    run_functional_data_tests(suite, root)
    
    return suite
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
