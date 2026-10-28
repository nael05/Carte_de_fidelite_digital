/**
 * Password Validator - Synchronisé avec Frontend
 * Utilisé pour valider les mots de passe avec les mêmes règles partout
 */

export const PASSWORD_MIN_LENGTH = 10;
// bcrypt ne prend en compte que les 72 premiers octets : au-delà, la saisie serait ignorée en silence.
export const PASSWORD_MAX_LENGTH = 72;

// Fragments de mots de passe triviaux (comparés sans accents ni ponctuation, en minuscules).
const COMMON_FRAGMENTS = ['password', 'motdepasse', 'azerty', 'qwerty', '123456', 'abcdef', 'fidelyz', 'bienvenue', 'welcome'];

export function validatePassword(password) {
  const errors = [];
  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Le mot de passe est requis'] };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Minimum ${PASSWORD_MIN_LENGTH} caractères requis`);
  }
  if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_LENGTH) {
    errors.push(`Maximum ${PASSWORD_MAX_LENGTH} caractères`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Au moins une majuscule requise');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Au moins une minuscule requise');
  }
  if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Au moins un chiffre ou caractère spécial requis');
  }
  const simplified = password.normalize('NFD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (COMMON_FRAGMENTS.some((fragment) => simplified.includes(fragment))) {
    errors.push('Mot de passe trop courant : évitez « password », « azerty », « 123456 »…');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valide la complexité du nouveau mot de passe vs ancien
 * @param {string} newPassword - Nouveau mot de passe
 * @param {string} hashedOldPassword - Ancien mot de passe hashé (bcrypt)
 * @param {string} plainOldPassword - Ancien mot de passe en clair (optionnel, pour comparaison)
 * @returns {object} { isValid: boolean, error: string|null }
 */
export async function validatePasswordChange(
  newPassword,
  hashedOldPassword,
  plainOldPassword = null
) {
  const bcrypt = await import('bcryptjs');
  const complexityCheck = validatePassword(newPassword);
  if (!complexityCheck.isValid) {
    return {
      isValid: false,
      error: 'Exigences du mot de passe non respectées: ' + complexityCheck.errors.join(', '),
    };
  }
  if (plainOldPassword) {
    const isSamePassword = await bcrypt.default.compare(plainOldPassword, hashedOldPassword);
    if (isSamePassword) {
      return {
        isValid: false,
        error: 'Le nouveau mot de passe doit être différent de l\'ancien',
      };
    }
  }

  return { isValid: true, error: null };
}
