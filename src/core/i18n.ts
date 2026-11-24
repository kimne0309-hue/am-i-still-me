/** All UI strings (EN; JA/KO stretch). */

/** Complete set of UI strings for one locale. */
export interface Strings {
  // Landing
  /** "A HAUNTED MIRROR" */
  landing_eyebrow: string;
  /** "Am I Still Me?" */
  landing_hero: string;
  /** "If every part of you were replaced, would you still be you?" */
  landing_subtitle: string;
  /** "Begin the ritual" */
  landing_begin: string;
  /** "Your image never leaves this device." */
  landing_privacy: string;

  // Offering
  /** "Make an offering" */
  offering_title: string;
  /** "Offer a photograph" */
  offering_upload_title: string;
  /** "Upload a portrait from your device" */
  offering_upload_desc: string;
  /** "Look into the mirror" */
  offering_webcam_title: string;
  /** "Take a photo with your camera" */
  offering_webcam_desc: string;
  /** "Back" */
  offering_back: string;

  // Framing
  /** "Frame your reflection" */
  framing_title: string;
  /** "Begin" */
  framing_begin: string;
  /** "4 × 4" */
  framing_size_4: string;
  /** "A Whisper" */
  framing_size_4_sub: string;
  /** "6 × 6" */
  framing_size_6: string;
  /** "A Haunting" */
  framing_size_6_sub: string;
  /** "8 × 8" */
  framing_size_8: string;
  /** "A Possession" */
  framing_size_8_sub: string;

  // Ritual
  /** "ORIGINAL PARTS REMAINING" */
  ritual_counter_label: string;
  /** "Replace a piece" */
  ritual_replace: string;
  /** "Auto" */
  ritual_auto: string;
  /** "Sound" */
  ritual_sound: string;

  // Question 1
  /** "Every part of you has been replaced. Are you still you?" */
  question1_text: string;
  /** "Yes" */
  question1_yes: string;
  /** "No" */
  question1_no: string;

  // Second Ship
  /** "Every original piece remains." */
  ship_intro: string;
  /** "THE GHOST" */
  ship_ghost_label: string;
  /** "THE REASSEMBLED" */
  ship_reassembled_label: string;
  /** "Which one is you?" */
  ship_question: string;
  /** "The Ghost" */
  ship_answer_ghost: string;
  /** "The Reassembled" */
  ship_answer_reassembled: string;
  /** "Neither" */
  ship_answer_neither: string;
  /** "Both" */
  ship_answer_both: string;

  // Verdict
  /** "Download Certificate" */
  verdict_download: string;
  /** "Restore me" */
  verdict_restore: string;
  /** "Begin again" */
  verdict_restart: string;

  // Restore (T8)
  /** "The mirror gives back what it took…" */
  restore_log: string;
  /** "Restored. But are you the same one who began?" */
  restore_done: string;

  // Leave dialog
  /** "✕ Leave" */
  leave_button: string;
  /** "Leave the mirror?" */
  leave_title: string;
  /** "Your reflection will be forgotten." */
  leave_body: string;
  /** "Stay" */
  leave_stay: string;
  /** "Leave" */
  leave_confirm: string;

  // Errors / toasts
  /** "The mirror cannot see this. Try another image." */
  error_bad_file: string;
  /** "The mirror cannot see this. (too large)" */
  error_too_large: string;
  /** "The mirror cannot open its eye. Camera access was denied." */
  error_camera_denied: string;
  /** "The mirror clouded over. Try again." */
  error_prepare: string;
  /** "The ritual was interrupted." */
  error_ritual: string;
  /** "Long-press to save." */
  error_download: string;

  // Misc
  /** "Sound" */
  mute_label: string;
  /** "seed" */
  seed_label: string;
}

/** English strings. */
export const EN: Strings = {
  // Landing
  landing_eyebrow: 'A HAUNTED MIRROR',
  landing_hero: 'Am I Still Me?',
  landing_subtitle:
    'If every part of you were replaced, would you still be you?',
  landing_begin: 'Begin the ritual',
  landing_privacy: 'Your image never leaves this device.',

  // Offering
  offering_title: 'Make an offering',
  offering_upload_title: 'Offer a photograph',
  offering_upload_desc: 'Upload a portrait from your device',
  offering_webcam_title: 'Look into the mirror',
  offering_webcam_desc: 'Take a photo with your camera',
  offering_back: 'Back',

  // Framing
  framing_title: 'Frame your reflection',
  framing_begin: 'Begin',
  framing_size_4: '4 × 4',
  framing_size_4_sub: 'A Whisper',
  framing_size_6: '6 × 6',
  framing_size_6_sub: 'A Haunting',
  framing_size_8: '8 × 8',
  framing_size_8_sub: 'A Possession',

  // Ritual
  ritual_counter_label: 'ORIGINAL PARTS REMAINING',
  ritual_replace: 'Replace a piece',
  ritual_auto: 'Auto',
  ritual_sound: 'Sound',

  // Question 1
  question1_text:
    'Every part of you has been replaced. Are you still you?',
  question1_yes: 'Yes',
  question1_no: 'No',

  // Second Ship
  ship_intro: 'Every original piece remains.',
  ship_ghost_label: 'THE GHOST',
  ship_reassembled_label: 'THE REASSEMBLED',
  ship_question: 'Which one is you?',
  ship_answer_ghost: 'The Ghost',
  ship_answer_reassembled: 'The Reassembled',
  ship_answer_neither: 'Neither',
  ship_answer_both: 'Both',

  // Verdict
  verdict_download: 'Download Certificate',
  verdict_restore: 'Restore me',
  verdict_restart: 'Begin again',

  // Restore (T8)
  restore_log: 'The mirror gives back what it took\u2026',
  restore_done: 'Restored. But are you the same one who began?',

  // Leave dialog
  leave_button: '\u2715 Leave',
  leave_title: 'Leave the mirror?',
  leave_body: 'Your reflection will be forgotten.',
  leave_stay: 'Stay',
  leave_confirm: 'Leave',

  // Errors / toasts
  error_bad_file: 'The mirror cannot see this. Try another image.',
  error_too_large: 'The mirror cannot see this. (too large)',
  error_camera_denied:
    'The mirror cannot open its eye. Camera access was denied.',
  error_prepare: 'The mirror clouded over. Try again.',
  error_ritual: 'The ritual was interrupted.',
  error_download: 'Long-press to save.',

  // Misc
  mute_label: 'Sound',
  seed_label: 'seed',
};

/**
 * Get strings for a locale. Only 'en' is supported for now;
 * any other value falls back to EN.
 */
export function getStrings(locale?: string): Strings {
  void locale; // JA/KO stretch — always EN for now
  return EN;
}
