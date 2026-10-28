// Règles de mot de passe : mêmes critères que le serveur (backend/utils/passwordValidator.js).
export const PASSWORD_MIN_LENGTH = 10;

const COMMON_FRAGMENTS = ['password', 'motdepasse', 'azerty', 'qwerty', '123456', 'abcdef', 'fidelyz', 'bienvenue', 'welcome'];
const isCommon = (p) => {
  const simplified = p.normalize('NFD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return COMMON_FRAGMENTS.some((fragment) => simplified.includes(fragment));
};

// Critères affichés à l'utilisateur pendant la saisie.
export const PASSWORD_RULES = [
  { id: 'length', label: `${PASSWORD_MIN_LENGTH} caractères minimum`, test: (p) => p.length >= PASSWORD_MIN_LENGTH },
  { id: 'upper', label: 'Une majuscule', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Une minuscule', test: (p) => /[a-z]/.test(p) },
  { id: 'digit', label: 'Un chiffre ou un caractère spécial', test: (p) => /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
  { id: 'common', label: 'Pas un mot de passe courant', test: (p) => !!p && !isCommon(p) },
];

/**
 * Validate password strength and requirements
 * @param {string} password - Password to validate
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export function validatePassword(password) {
  if (!password) {
    return { isValid: false, errors: ['Le mot de passe est requis'] };
  }
  const errors = PASSWORD_RULES.filter((rule) => !rule.test(password)).map((rule) => rule.label);
  return { isValid: errors.length === 0, errors };
}

/**
 * Get password strength level
 * @param {string} password - Password to evaluate
 * @returns {string} - 'faible' | 'moyen' | 'fort'
 */
export function getPasswordStrength(password) {
  if (!password) return 'faible';
  
  let strength = 0;
  
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;
  
  if (strength <= 1) return 'faible';
  if (strength <= 3) return 'moyen';
  return 'fort';
}
