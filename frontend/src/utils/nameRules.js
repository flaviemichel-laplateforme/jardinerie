export function validateName(name) {
  if (!/^[a-zA-ZÀ-ÿ' -]+$/.test(name.trim())) {
    return "Le nom et prénom ne doivent contenir que des lettres, espaces, tirets ou apostrophes (pas de chiffres ni de caractères spéciaux).";
  }
  return null;
}
