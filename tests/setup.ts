import '@testing-library/jest-dom/vitest'

// jsdom n'implémente pas scrollIntoView, utilisé par ArchiveAccordion pour
// ramener le joueur sur la ligne du jour quand il revient via `?from=…`.
if (typeof window !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {}
}
