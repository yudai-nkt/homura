export const timingSafeEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  let result = a.length === b.length ? 0 : 1;
  let index = Math.min(a.length, b.length);
  while (index-- > 0) {
    result |= a[index] ^ b[index];
  }
  return result === 0;
};

export const computeHexSignature = async (
  content: string,
  secret: string
): Promise<string> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-1" },
    true,
    ["sign", "verify"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(content)
  );

  return [...new Uint8Array(signature)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
};
