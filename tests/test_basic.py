"""
Basic tests for the sekolah-pseo project.
These tests verify that core utilities and configurations work correctly.
"""

import os
import sys
import json
import pytest

# Add project root to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestProjectStructure:
    """Test that the project has the correct structure."""
    
    def test_package_json_exists(self):
        """Verify package.json exists and is valid JSON."""
        package_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'package.json')
        assert os.path.exists(package_path), "package.json should exist"
        
        with open(package_path, 'r') as f:
            package = json.load(f)
        
        assert 'name' in package, "package.json should have name field"
        assert 'version' in package, "package.json should have version field"
        assert package['name'] == 'sekolah-pseo', "Project name should be sekolah-pseo"
    
    def test_required_directories_exist(self):
        """Verify required project directories exist."""
        root = os.path.dirname(os.path.dirname(__file__))
        required_dirs = ['src', 'scripts', 'data', 'docs']
        
        for dir_name in required_dirs:
            dir_path = os.path.join(root, dir_name)
            assert os.path.exists(dir_path), f"Required directory {dir_name} should exist"
    
    def test_schools_data_exists(self):
        """Verify schools.csv data file exists."""
        data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'schools.csv')
        assert os.path.exists(data_path), "schools.csv should exist in data/"


class TestConfiguration:
    """Test configuration and environment setup."""
    
    def test_env_example_exists(self):
        """Verify .env.example exists."""
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.example')
        assert os.path.exists(env_path), ".env.example should exist"
    
    def test_readme_exists(self):
        """Verify README.md exists and has content."""
        readme_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'README.md')
        assert os.path.exists(readme_path), "README.md should exist"
        
        with open(readme_path, 'r') as f:
            content = f.read()
        
        assert len(content) > 100, "README.md should have substantial content"
        assert 'Sekolah PSEO' in content, "README should mention project name"


class TestJavaScriptTests:
    """Verify JavaScript test files exist and are valid."""
    
    def test_js_test_files_exist(self):
        """Verify JavaScript test files exist."""
        scripts_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'scripts')
        test_files = [
            'utils.test.js',
            'rate-limiter.test.js',
            'resilience.test.js',
            'PageBuilder.test.js',
        ]
        
        for test_file in test_files:
            test_path = os.path.join(scripts_dir, test_file)
            assert os.path.exists(test_path), f"Test file {test_file} should exist"


class TestGitHubWorkflows:
    """Test GitHub Actions workflow configuration."""
    
    def test_workflows_directory_exists(self):
        """Verify .github/workflows directory exists."""
        workflows_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.github', 'workflows')
        assert os.path.exists(workflows_dir), ".github/workflows directory should exist"
    
    def test_on_push_workflow_exists(self):
        """Verify on-push.yml workflow exists."""
        workflow_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            '.github', 'workflows', 'on-push.yml'
        )
        assert os.path.exists(workflow_path), "on-push.yml workflow should exist"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
