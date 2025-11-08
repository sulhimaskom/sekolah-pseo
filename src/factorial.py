def factorial(n):
    """计算 n 的阶乘
    
    Args:
        n (int): 非负整数
        
    Returns:
        int: n 的阶乘值
        
    Raises:
        ValueError: 当 n 为负数时抛出异常
    """
    if n < 0:
        raise ValueError("阶乘不能为负数")
    if n == 0 or n == 1:
        return 1
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result