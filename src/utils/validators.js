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

export function getErrorMessage(err, lang = 'tr') {
  let code = '';
  if (typeof err === 'string') {
    code = err;
  } else if (err && typeof err === 'object') {
    code = err.code || err.message || '';
  }

  // Extract firebase code if embedded in error string (e.g. "Firebase: Error (auth/invalid-credential).")
  const match = String(code).match(/auth\/[a-z-]+/);
  if (match) {
    code = match[0];
  }

  // Check for client blocking / network abort
  const errStr = String(err?.message || err || '');
  if (errStr.includes('BLOCKED_BY_CLIENT') || errStr.includes('blocked') || err?.code === 'failed-precondition') {
    return lang === 'en'
      ? 'Your data connection may be blocked by a browser privacy or ad blocker. Try disabling Brave Shields or similar blockers for this site and try again.'
      : 'Veri bağlantısı tarayıcı veya gizlilik/reklam engelleyici tarafından engelleniyor olabilir. Bu site için Brave Shields veya benzeri engelleyicileri geçici olarak kapatıp tekrar deneyin.';
  }

  const messagesTr = {
    'auth/invalid-credential': 'Mevcut şifreniz veya giriş bilgileriniz hatalı. Lütfen kontrol ediniz.',
    'auth/wrong-password': 'Mevcut şifreniz hatalı.',
    'auth/user-not-found': 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.',
    'auth/email-already-in-use': 'Bu e-posta adresi zaten kullanılıyor.',
    'auth/invalid-email': 'Geçersiz e-posta adresi formatı.',
    'auth/weak-password': 'Şifre en az 6 karakter olmalıdır.',
    'auth/operation-not-allowed': 'E-posta/Şifre ile giriş sağlayıcısı bu projede etkinleştirilmemiş.',
    'auth/unauthorized-domain': 'Bu alan adı Firebase Authentication için yetkilendirilmemiş.',
    'auth/requires-recent-login': 'Bu güvenlik işlemi için lütfen oturumunuzu kapatıp tekrar giriş yapınız.',
    'auth/too-many-requests': 'Çok fazla başarısız deneme yapıldı. Lütfen bir süre sonra tekrar deneyin.',
    'auth/network-request-failed': 'Ağ bağlantı hatası. Lütfen internetinizi kontrol edin.',
    'REGISTRATION_FAILED': 'Kayıt sırasında profiliniz oluşturulamadı. Lütfen tekrar deneyin.',
  };

  const messagesEn = {
    'auth/invalid-credential': 'Your current password or credentials are incorrect. Please verify and try again.',
    'auth/wrong-password': 'Your current password is incorrect.',
    'auth/user-not-found': 'No registered user found with this email address.',
    'auth/email-already-in-use': 'This email address is already in use.',
    'auth/invalid-email': 'Invalid email address format.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/operation-not-allowed': 'Email/Password provider is not enabled in Firebase for this project.',
    'auth/unauthorized-domain': 'This domain is not authorized for Firebase Authentication operations.',
    'auth/requires-recent-login': 'This security action requires recent authentication. Please log in again.',
    'auth/too-many-requests': 'Too many failed attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network connection error. Please check your internet connection.',
    'REGISTRATION_FAILED': 'Your profile could not be created during registration. Please try again.',
  };

  const dict = lang === 'en' ? messagesEn : messagesTr;
  return dict[code] || err?.message || (lang === 'en' ? 'An error occurred. Please try again.' : 'Bir hata oluştu. Lütfen tekrar deneyin.');
}
