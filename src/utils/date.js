// DevStack — Tarih Formatlama (Türkçe)

const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const fullMonths = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export function formatRelativeTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  const diff = now - d;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Az önce';
  if (minutes < 60) return `${minutes} dakika önce`;
  if (hours < 24) return `${hours} saat önce`;
  if (days === 1) return 'Dün';
  if (days < 7) return `${days} gün önce`;
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function formatDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
  return `${d.getDate()} ${fullMonths[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return 'İyi Geceler';
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi Günler';
  return 'İyi Akşamlar';
}
