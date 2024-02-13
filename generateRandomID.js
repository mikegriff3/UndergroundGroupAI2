export function generateRandomID() {
  // Generate a random number between 100000 (inclusive) and 999999 (inclusive)
  return Math.floor(100000 + Math.random() * 900000);
}
