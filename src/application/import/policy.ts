/** Public resource limits shared by the importer, tools, and static documentation. */
export const IMPORT_LIMITS = Object.freeze({
  fileBytes: 25 * 1024 * 1024,
  sessionBytes: 100 * 1024 * 1024,
  files: 20,
  pages: 200,
})
