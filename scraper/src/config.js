/**
 * Scraper Configuration
 *
 * Data is licensed under CC BY-ND 3.0 DE
 * Source: Förderdatenbank (foerderdatenbank.de) © BMWK
 */

export const config = {
  // Scraping behavior
  delay: 5000, // 5 seconds between requests (respectful)
  maxRetries: 3,
  timeout: 30000,

  // URLs
  baseUrl: 'https://www.foerderdatenbank.de',
  searchUrl: 'https://www.foerderdatenbank.de/SiteGlobals/FDB/Forms/Suche/Startseitensuche_Formular.html',
  searchParams: {
    filterCategories: 'FundingProgram',
    submit: 'Suchen'
  },

  // User agent (identify ourselves)
  userAgent: 'subsidy4u-scraper/1.0 (+https://github.com/subsidy4u) - Building better subsidy search for German companies',

  // Attribution (CC BY-ND 3.0 DE requirement)
  attribution: {
    source: 'Förderdatenbank',
    url: 'https://www.foerderdatenbank.de',
    operator: 'Bundesministerium für Wirtschaft und Klimaschutz (BMWK)',
    license: 'CC BY-ND 3.0 DE',
    licenseUrl: 'https://creativecommons.org/licenses/by-nd/3.0/de/'
  },

  // Progress tracking
  progressFile: './progress.json',

  // Selectors
  selectors: {
    programCard: '.card--fundingprogram',
    programLink: 'a[href*="/Content/"]',
    basketId: '[data-basket-id]',
    nextButton: 'a.forward.button',

    // Detail page selectors
    title: 'h1',
    metadata: {
      foerderart: '.card__meta-item',
      // We'll parse these from the page structure
    }
  }
};