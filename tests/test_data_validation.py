# tests/test_data_validation.py
"""
Tests for data validation and ETL processes.
"""

import os
import sys
import csv
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestSchoolsData:
    """Test the schools.csv data file."""
    
    @pytest.fixture
    def schools_data(self):
        """Load schools.csv data."""
        data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'schools.csv')
        if not os.path.exists(data_path):
            pytest.skip("schools.csv not found")
        
        with open(data_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            return list(reader)
    
    def test_csv_has_required_columns(self, schools_data):
        """Verify CSV has all required columns."""
        if not schools_data:
            pytest.skip("No data in schools.csv")
        
        required_columns = ['npsn', 'nama', 'provinsi', 'kab_kota', 'kecamatan']
        first_row = schools_data[0]
        
        for col in required_columns:
            assert col in first_row, f"Required column '{col}' should exist"
    
    def test_npsn_is_numeric(self, schools_data):
        """Verify NPSN values are numeric."""
        if not schools_data:
            pytest.skip("No data in schools.csv")
        
        for row in schools_data[:10]:  # Check first 10 rows
            npsn = row.get('npsn', '').strip()
            if npsn:
                assert npsn.isdigit(), f"NPSN '{npsn}' should be numeric"
    
    def test_no_empty_required_fields(self, schools_data):
        """Verify required fields are not empty."""
        if not schools_data:
            pytest.skip("No data in schools.csv")
        
        required_fields = ['npsn', 'nama', 'provinsi', 'kab_kota']
        
        for row in schools_data[:20]:  # Check first 20 rows
            for field in required_fields:
                value = row.get(field, '').strip()
                assert value, f"Required field '{field}' should not be empty in row with NPSN {row.get('npsn', 'unknown')}"


class TestDataIntegrity:
    """Test data integrity and consistency."""
    
    def test_external_directory_exists(self):
        """Verify external/ directory exists for raw data."""
        external_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'external')
        assert os.path.exists(external_dir), "external/ directory should exist"
    
    def test_dist_directory_can_be_created(self):
        """Verify dist/ directory can be created."""
        root = os.path.dirname(os.path.dirname(__file__))
        dist_dir = os.path.join(root, 'dist')
        
        # Clean up if exists
        if os.path.exists(dist_dir):
            import shutil
            shutil.rmtree(dist_dir)
        
        # Try to create
        os.makedirs(dist_dir, exist_ok=True)
        assert os.path.exists(dist_dir), "dist/ directory should be creatable"
        
        # Clean up
        if os.path.exists(dist_dir):
            import shutil
            shutil.rmtree(dist_dir)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
