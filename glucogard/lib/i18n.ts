import * as Localization from 'expo-localization';

export type Language = 'en' | 'rw';

export interface TranslationKeys {
  // Common
  'common.yes': string;
  'common.no': string;
  'common.cancel': string;
  'common.save': string;
  'common.continue': string;
  'common.back': string;
  'common.next': string;
  'common.finish': string;
  'common.loading': string;
  'common.error': string;
  'common.success': string;

  // Navigation
  'nav.dashboard': string;
  'nav.assessment': string;
  'nav.patients': string;
  'nav.profile': string;
  'nav.settings': string;

  // Assessment
  'assessment.title': string;
  'assessment.subtitle': string;
  'assessment.start': string;
  'assessment.progress': string;
  'assessment.complete': string;

  // Risk levels
  'risk.low': string;
  'risk.moderate': string;
  'risk.critical': string;

  // Notifications
  'notifications.medication.title': string;
  'notifications.medication.body': string;
  'notifications.hydration.title': string;
  'notifications.hydration.body': string;
  'notifications.exercise.title': string;
  'notifications.exercise.body': string;

  // Location
  'location.permission.title': string;
  'location.permission.message': string;
  'location.nearby.hospitals': string;
  'location.nearby.clinics': string;
  'location.nearby.pharmacies': string;
  'location.nearby.markets': string;
}

const translations: Record<Language, TranslationKeys> = {
  en: {
    // Common
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.continue': 'Continue',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.finish': 'Finish',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.assessment': 'Assessment',
    'nav.patients': 'Patients',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',

    // Assessment
    'assessment.title': 'Health Assessment',
    'assessment.subtitle': 'Complete your personalized health evaluation',
    'assessment.start': 'Start Assessment',
    'assessment.progress': 'Progress',
    'assessment.complete': 'Assessment Complete',

    // Risk levels
    'risk.low': 'Low Risk',
    'risk.moderate': 'Moderate Risk',
    'risk.critical': 'Critical Risk',

    // Notifications
    'notifications.medication.title': 'Medication Reminder',
    'notifications.medication.body': 'Time to take your medication',
    'notifications.hydration.title': 'Stay Hydrated!',
    'notifications.hydration.body': 'Remember to drink water',
    'notifications.exercise.title': 'Time to Move!',
    'notifications.exercise.body': 'A short walk can help your health',

    // Location
    'location.permission.title': 'Location Permission',
    'location.permission.message': 'We need location access to provide nearby health recommendations',
    'location.nearby.hospitals': 'Nearby Hospitals',
    'location.nearby.clinics': 'Nearby Clinics',
    'location.nearby.pharmacies': 'Nearby Pharmacies',
    'location.nearby.markets': 'Nearby Markets',
  },
  rw: {
    // Common
    'common.yes': 'Yego',
    'common.no': 'Oya',
    'common.cancel': 'Kuraguza',
    'common.save': 'Kubika',
    'common.continue': 'Komeza',
    'common.back': 'Subira',
    'common.next': 'Ikurikira',
    'common.finish': 'Kurangiza',
    'common.loading': 'Birategerezwa...',
    'common.error': 'Ikosa',
    'common.success': 'Byagenze neza',

    // Navigation
    'nav.dashboard': 'Ikibaho',
    'nav.assessment': 'Isuzuma',
    'nav.patients': 'Abarwayi',
    'nav.profile': 'Umwirondoro',
    'nav.settings': 'Amagenamiterere',

    // Assessment
    'assessment.title': 'Isuzuma ry\'ubuzima',
    'assessment.subtitle': 'Uzuza isuzuma ryawe ry\'ubuzima',
    'assessment.start': 'Tangira Isuzuma',
    'assessment.progress': 'Aho bigeze',
    'assessment.complete': 'Isuzuma ryarangiye',

    // Risk levels
    'risk.low': 'Ingaruka nke',
    'risk.moderate': 'Ingaruka zo hagati',
    'risk.critical': 'Ingaruka zikomeye',

    // Notifications
    'notifications.medication.title': 'Ibutsa ry\'imiti',
    'notifications.medication.body': 'Ni igihe cyo gufata imiti yawe',
    'notifications.hydration.title': 'Nywa amazi!',
    'notifications.hydration.body': 'Wibuke kunywa amazi',
    'notifications.exercise.title': 'Ni igihe cyo kwimura!',
    'notifications.exercise.body': 'Kugenda gato bishobora gufasha ubuzima bwawe',

    // Location
    'location.permission.title': 'Uruhushya rwo kumenya aho uri',
    'location.permission.message': 'Dukeneye kumenya aho uri kugira ngo duguhe inama z\'ubuzima hafi yawe',
    'location.nearby.hospitals': 'Ibitaro biri hafi',
    'location.nearby.clinics': 'Ivuriro biri hafi',
    'location.nearby.pharmacies': 'Amaduka y\'imiti ari hafi',
    'location.nearby.markets': 'Amasoko ari hafi',
  }
};

let currentLanguage: Language = 'en';

export function initializeI18n(): void {
  // Detect system language
  const systemLanguage = Localization.locale;
  if (systemLanguage.startsWith('rw')) {
    currentLanguage = 'rw';
  } else {
    currentLanguage = 'en';
  }
}

export function getCurrentLanguage(): Language {
  return currentLanguage;
}

export function setLanguage(language: Language): void {
  currentLanguage = language;
}

export function t(key: keyof TranslationKeys): string {
  return translations[currentLanguage][key] || translations['en'][key] || key;
}

export function getAvailableLanguages(): { code: Language; name: string; nativeName: string }[] {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda' }
  ];
}