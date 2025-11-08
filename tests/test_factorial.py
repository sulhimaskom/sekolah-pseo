import pytest
from src.factorial import factorial

def test_factorial_zero():
    assert factorial(0) == 1

def test_factorial_one():
    assert factorial(1) == 1

def test_factorial_positive():
    assert factorial(5) == 120

def test_factorial_larger_number():
    assert factorial(10) == 3628800

def test_factorial_negative():
    with pytest.raises(ValueError):
        factorial(-1)

def test_factorial_non_integer():
    with pytest.raises(TypeError):
        factorial("5")
        
    with pytest.raises(TypeError):
        factorial(5.5)
        
    with pytest.raises(TypeError):
        factorial(None)
        
    with pytest.raises(TypeError):
        factorial([1, 2, 3])