describe('Simple Test Suite', () => {
  test('should verify Jest is working correctly', () => {
    expect(1 + 1).toBe(2);
  });

  test('should verify TypeScript compilation', () => {
    const message: string = 'Hello, Testing!';
    expect(message).toBe('Hello, Testing!');
  });

  test('should verify async/await support', async () => {
    const asyncFunction = async (): Promise<string> => {
      return new Promise((resolve) => {
        setTimeout(() => resolve('async result'), 10);
      });
    };

    const result = await asyncFunction();
    expect(result).toBe('async result');
  });

  test('should verify object matching', () => {
    const testObject = {
      name: 'Test User',
      role: 'ADMIN',
      active: true
    };

    expect(testObject).toEqual({
      name: 'Test User',
      role: 'ADMIN',
      active: true
    });
  });

  test('should verify array operations', () => {
    const testArray = [1, 2, 3, 4, 5];
    
    expect(testArray).toHaveLength(5);
    expect(testArray).toContain(3);
    expect(testArray.filter(n => n > 3)).toEqual([4, 5]);
  });
}); 