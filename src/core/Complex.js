/**
 * Immutable complex number implementation for quantum amplitudes.
 *
 * A complex number is represented as a + bi where:
 * - a is the real component
 * - b is the imaginary component
 *
 * In this runtime, amplitudes are complex values and probabilities are computed as:
 * P = |a + bi|^2 = a^2 + b^2
 */
class Complex {
  /**
   * @param {number} real
   * @param {number} imag
   */
  constructor(real = 0, imag = 0) {
    if (!Number.isFinite(real) || !Number.isFinite(imag)) {
      throw new TypeError('Complex components must be finite numbers.');
    }

    this.real = real;
    this.imag = imag;

    Object.freeze(this);
  }

  /**
   * Euclidean magnitude: |z| = sqrt(a^2 + b^2)
   * @returns {number}
   */
  magnitude() {
    return Math.hypot(this.real, this.imag);
  }

  /**
   * Squared magnitude: |z|^2 = a^2 + b^2
   * Useful for quantum probability calculations.
   * @returns {number}
   */
  magnitudeSquared() {
    return this.real * this.real + this.imag * this.imag;
  }

  /**
   * Polar phase angle in radians in range [-pi, pi].
   * @returns {number}
   */
  phase() {
    return Math.atan2(this.imag, this.real);
  }

  /**
   * z1 + z2
   * @param {Complex} other
   * @returns {Complex}
   */
  add(other) {
    const complex = Complex._coerce(other, 'add');
    return new Complex(this.real + complex.real, this.imag + complex.imag);
  }

  /**
   * z1 - z2
   * @param {Complex} other
   * @returns {Complex}
   */
  subtract(other) {
    const complex = Complex._coerce(other, 'subtract');
    return new Complex(this.real - complex.real, this.imag - complex.imag);
  }

  /**
   * (a + bi)(c + di) = (ac - bd) + (ad + bc)i
   * @param {Complex} other
   * @returns {Complex}
   */
  multiply(other) {
    const complex = Complex._coerce(other, 'multiply');
    return new Complex(
      this.real * complex.real - this.imag * complex.imag,
      this.real * complex.imag + this.imag * complex.real
    );
  }

  /**
   * z / w = z * conjugate(w) / |w|^2
   * @param {Complex} other
   * @returns {Complex}
   */
  divide(other) {
    const complex = Complex._coerce(other, 'divide');
    const denominator = complex.magnitudeSquared();

    if (denominator <= Number.EPSILON) {
      throw new RangeError('Cannot divide by zero-magnitude complex number.');
    }

    const numerator = this.multiply(complex.conjugate());
    return new Complex(numerator.real / denominator, numerator.imag / denominator);
  }

  /**
   * Scalar multiplication by a finite real number.
   * @param {number} scalar
   * @returns {Complex}
   */
  scale(scalar) {
    if (!Number.isFinite(scalar)) {
      throw new TypeError('Scale factor must be a finite number.');
    }

    return new Complex(this.real * scalar, this.imag * scalar);
  }

  /**
   * Complex conjugate: (a + bi)* = a - bi
   * @returns {Complex}
   */
  conjugate() {
    return new Complex(this.real, -this.imag);
  }

  /**
   * Numerical equality with tolerance.
   * @param {Complex} other
   * @param {number} [epsilon=1e-12]
   * @returns {boolean}
   */
  equals(other, epsilon = 1e-12) {
    const complex = Complex._coerce(other, 'equals');
    if (!Number.isFinite(epsilon) || epsilon < 0) {
      throw new TypeError('epsilon must be a non-negative finite number.');
    }

    return (
      Math.abs(this.real - complex.real) <= epsilon &&
      Math.abs(this.imag - complex.imag) <= epsilon
    );
  }

  /**
   * @returns {Complex}
   */
  clone() {
    return new Complex(this.real, this.imag);
  }

  /**
   * @returns {string}
   */
  toString() {
    const realPart = this.real.toFixed(6);
    const imagAbs = Math.abs(this.imag).toFixed(6);
    const sign = this.imag >= 0 ? '+' : '-';
    return `${realPart}${sign}${imagAbs}i`;
  }

  /**
   * Construct from polar form: z = r(cos(theta) + i sin(theta))
   * @param {number} magnitude
   * @param {number} phase
   * @returns {Complex}
   */
  static fromPolar(magnitude, phase) {
    if (!Number.isFinite(magnitude) || !Number.isFinite(phase)) {
      throw new TypeError('Polar components must be finite numbers.');
    }
    if (magnitude < 0) {
      throw new RangeError('Polar magnitude must be non-negative.');
    }

    return new Complex(magnitude * Math.cos(phase), magnitude * Math.sin(phase));
  }

  /**
   * @returns {Complex}
   */
  static zero() {
    return new Complex(0, 0);
  }

  /**
   * @param {unknown} value
   * @param {string} operation
   * @returns {Complex}
   */
  static _coerce(value, operation) {
    if (value instanceof Complex) {
      return value;
    }

    throw new TypeError(`Complex.${operation} requires a Complex operand.`);
  }
}

module.exports = Complex;
