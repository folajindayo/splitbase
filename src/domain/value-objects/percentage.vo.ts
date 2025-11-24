/**
 * Percentage Value Object
 * Represents a percentage value with validation
 */

export class Percentage {
  private readonly value: number;

  private constructor(value: number) {
    this.value = value;
  }

  static create(value: number): Percentage {
    if (value < 0 || value > 100) {
      throw new Error('Percentage must be between 0 and 100');
    }
    return new Percentage(value);
  }

  static fromDecimal(decimal: number): Percentage {
    return Percentage.create(decimal * 100);
  }

  getValue(): number {
    return this.value;
  }

  toDecimal(): number {
    return this.value / 100;
  }

  toString(): string {
    return `${this.value.toFixed(2)}%`;
  }

  add(other: Percentage): Percentage {
    return Percentage.create(this.value + other.value);
  }

  subtract(other: Percentage): Percentage {
    return Percentage.create(this.value - other.value);
  }

  equals(other: Percentage): boolean {
    return Math.abs(this.value - other.value) < 0.01;
  }

  toJSON() {
    return {
      value: this.value,
      decimal: this.toDecimal(),
      display: this.toString(),
    };
  }
}


