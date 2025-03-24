import { cn } from '@/lib/utils';

describe('cn function', () => {
  it('merges class names correctly', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    const result = cn('base-class', true && 'true-class', false && 'false-class');
    expect(result).toBe('base-class true-class');
  });

  it('handles objects of classes', () => {
    const result = cn('base-class', { 'active-class': true, 'inactive-class': false });
    expect(result).toBe('base-class active-class');
  });

  it('handles arrays of classes', () => {
    const result = cn('base-class', ['array-class1', 'array-class2']);
    expect(result).toBe('base-class array-class1 array-class2');
  });

  it('handles conflicting tailwind classes using tailwind-merge', () => {
    // When conflicting Tailwind classes are provided, tailwind-merge should resolve them
    const result = cn('p-4', 'p-8');
    // The last conflicting class should win
    expect(result).toBe('p-8');
  });

  it('handles complex combinations of inputs', () => {
    const condition = true;
    const result = cn(
      'base-class',
      condition && 'conditional-class',
      ['array-class1', 'array-class2'],
      { 'object-true-class': true, 'object-false-class': false },
      'p-4 m-2',
      'p-8' // This should override p-4 from previous string
    );
    expect(result).toContain('base-class');
    expect(result).toContain('conditional-class');
    expect(result).toContain('array-class1');
    expect(result).toContain('array-class2');
    expect(result).toContain('object-true-class');
    expect(result).not.toContain('object-false-class');
    expect(result).toContain('m-2');
    expect(result).toContain('p-8');
    expect(result).not.toContain('p-4');
  });

  it('handles empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('handles null and undefined inputs', () => {
    const result = cn('class1', null, undefined, 'class2');
    expect(result).toBe('class1 class2');
  });
}); 