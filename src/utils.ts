export const timingSafeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  let result = a.length === b.length ? 0 : 1;
  let index = Math.min(a.length, b.length);
  while (index-- > 0) {
    result |= a[index] ^ b[index];
  }
  return result === 0;
};
