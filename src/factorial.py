def factorial(n):
    """Compute the factorial of a number.
    
    Args:
        n (int): A non-negative integer.
        
    Returns:
        int: The factorial of n.
        
    Raises:
        ValueError: If n is negative.
        TypeError: If n is not an integer.
    """
    if not isinstance(n, int):
        raise TypeError("n must be an integer")
    if n < 0:
        raise ValueError("n must be non-negative")
    if n == 0 or n == 1:
        return 1
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result