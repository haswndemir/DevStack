// DevStack — Form Validators

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password) {
  return password && password.length >= 6;
}

export function validateRequired(value) {
  return value && value.trim().length > 0;
}

export function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getErrorMessage(code) {
  const messages = {
    'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanılıyor.',
    'auth/invalid-email': 'Geçersiz e-posta adresi.',
    'auth/user-not-found': 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.',
    'auth/wrong-password': 'Hatalı şifre.',
    'auth/weak-password': 'Şifre en az 6 karakter olmalıdır.',
    'auth/too-many-requests': 'Çok fazla deneme. Lütfen daha sonra tekrar deneyin.',
    'auth/network-request-failed': 'İnternet bağlantınızı kontrol edin.',
    'auth/invalid-credential': 'Geçersiz giriş bilgileri. Lütfen tekrar deneyin.',
  };
  return messages[code] || 'Bir hata oluştu. Lütfen tekrar deneyin.';
}
