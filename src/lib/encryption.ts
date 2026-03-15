import CryptoJS from 'crypto-js';

export function encrypt(text: string, key: string): string {
  return CryptoJS.AES.encrypt(text, key).toString();
}

export function decrypt(ciphertext: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function hashPin(pin: string): string {
  return CryptoJS.SHA256(pin).toString();
}
