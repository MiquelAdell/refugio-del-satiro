# Future Ideas

Ideas and features explicitly deferred from V1. These are validated directions, not speculative — they were considered during planning and intentionally postponed.

## Member import from Google Sheets
Import association members from a Google Spreadsheet via the Google Sheets API (service account auth). This replaces manual member creation with a CLI sync command. Requires:
- Google Cloud project with Sheets API enabled
- Service account credentials JSON
- Spreadsheet shared with the service account
- CLI command that reads rows and upserts members by email
- Re-runnable to sync additions/updates; does NOT auto-delete removed members

Previously tracked as US-003 in the PRD before being deferred.

## UI translations (English)
V1 UI is in Spanish only. Add i18n infrastructure and a translation for:
- English — for broader accessibility

Requires choosing an i18n library (e.g., react-i18next), extracting all UI strings, and providing translation files.
