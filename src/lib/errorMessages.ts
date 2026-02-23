const errorTranslations: Record<string, string> = {
  'Invalid login credentials': 'Hibás email cím vagy jelszó.',
  'Email not confirmed': 'Az email cím nincs megerősítve.',
  'User already registered': 'Ez az email cím már regisztrálva van.',
  'Password should be at least 6 characters': 'A jelszónak legalább 6 karakter hosszúnak kell lennie.',
  'Signup requires a valid password': 'Érvényes jelszó szükséges a regisztrációhoz.',
  'User not found': 'Felhasználó nem található.',
  'Email rate limit exceeded': 'Túl sok email küldési kísérlet. Próbáld újra később.',
  'For security purposes, you can only request this once every 60 seconds': 'Biztonsági okokból csak 60 másodpercenként kérhetsz új kódot.',
  'New password should be different from the old password.': 'Az új jelszónak különböznie kell a régitől.',
  'Auth session missing!': 'Nincs aktív munkamenet. Kérjük, jelentkezz be újra.',
  'JWT expired': 'A munkamenet lejárt. Kérjük, jelentkezz be újra.',
  'Token has expired or is invalid': 'A token lejárt vagy érvénytelen.',
  'Unable to validate email address: invalid format': 'Érvénytelen email formátum.',
  'Signups not allowed for this instance': 'A regisztráció nem engedélyezett.',
  'A user with this email address has already been registered': 'Ezzel az email címmel már regisztráltak.',
  'over_email_send_rate_limit': 'Túl sok email küldési kísérlet. Próbáld újra később.',
};

export function translateError(message: string): string {
  if (!message) return 'Ismeretlen hiba történt.';
  
  // Exact match
  if (errorTranslations[message]) return errorTranslations[message];
  
  // Partial match
  for (const [key, value] of Object.entries(errorTranslations)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return value;
  }
  
  return message;
}
