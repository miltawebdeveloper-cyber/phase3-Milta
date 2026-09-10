import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { prerenderedShellFor } from './utils/prerenderedShell';
import { ThemeProvider, CssBaseline, CircularProgress } from '@mui/material';
import { ThemeContextProvider, useThemeMode } from './ThemeContext';
import { createAppTheme } from './theme';
import lazyWithRetry from './utils/lazyWithRetry';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import Home from './pages/Home';
const About = lazyWithRetry(() => import('./pages/About'));
const Contact = lazyWithRetry(() => import('./pages/Contact'));
const Career = lazyWithRetry(() => import('./pages/Career'));
const CareerSub = lazyWithRetry(() => import('./pages/careersub'));
const BookKeeping = lazyWithRetry(() => import('./pages/BookKeeping'));
const TaxPlanning = lazyWithRetry(() => import('./pages/TaxPlanning'));
const VirtualAssistance = lazyWithRetry(() => import('./pages/VirtualAssistance'));

const CPAServices = lazyWithRetry(() => import('./pages/CPAServices'));
const FinancialControllerServices = lazyWithRetry(() => import('./pages/FinancialControllerServices'));
const DataEntryServices = lazyWithRetry(() => import('./pages/DataEntryServices'));
const DigitalMarketing = lazyWithRetry(() => import('./pages/DigitalMarketing'));
const PayrollManagement = lazyWithRetry(() => import('./pages/PayrollManagement'));
const ContractorsCompanies = lazyWithRetry(() => import('./pages/ContractorsCompanies'));
const LawFirms = lazyWithRetry(() => import('./pages/LawFirms'));
const ManufacturingCompanies = lazyWithRetry(() => import('./pages/ManufacturingCompanies'));
const RealEstateCompanies = lazyWithRetry(() => import('./pages/RealEstateCompanies'));
const NonProfit = lazyWithRetry(() => import('./pages/NonProfit'));
const HealthCare = lazyWithRetry(() => import('./pages/HealthCare'));
const RetailBusiness = lazyWithRetry(() => import('./pages/Retail'));
const Restaurant = lazyWithRetry(() => import('./pages/Restaurant'));
const Blog = lazyWithRetry(() => import('./pages/Blog'));
const BlogDetails = lazyWithRetry(() => import('./pages/BlogDetails'));
const Areas = lazyWithRetry(() => import('./pages/Areas'));
// State service page imports removed — all state pages are now served from Supabase.
// The catch-all route below handles all /us/services/* paths.
import ScrollToTopOnNavigate from './components/ScrollToTopOnNavigate';
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazyWithRetry(() => import('./pages/TermsofService'));
const Services = lazyWithRetry(() => import('./pages/Services'));
const AccountingSoftware = lazyWithRetry(() => import('./pages/AccountingSoftware'));
const QuickBooksDesktop = lazyWithRetry(() => import('./pages/QuickBooksDesktop'));
const QuickBooksOnline = lazyWithRetry(() => import('./pages/quickBooksOnline'));
const Xero = lazyWithRetry(() => import('./pages/Xero'));
const WaveAccounting = lazyWithRetry(() => import('./pages/WaveAccounting'));

// ── UK site (rendered inside UkLayout under /uk) ──
const UkLayout = lazyWithRetry(() => import('./uk-pages/UkLayout'));
const UkHome = lazyWithRetry(() => import('./uk-pages/Home'));
const UkAbout = lazyWithRetry(() => import('./uk-pages/About'));
const UkWhyMilta = lazyWithRetry(() => import('./uk-pages/WhyMilta'));
const UkServices = lazyWithRetry(() => import('./uk-pages/Services'));
const UkBookKeeping = lazyWithRetry(() => import('./uk-pages/BookKeeping'));
const UkAccountsPayable = lazyWithRetry(() => import('./uk-pages/AccountsPayable'));
const UkAccountsReceivable = lazyWithRetry(() => import('./uk-pages/AccountsReceivable'));
const UkDigitalMarketing = lazyWithRetry(() => import('./uk-pages/DigitalMarketing'));
const UkPayroll = lazyWithRetry(() => import('./uk-pages/PayrollOutsourcing'));
const UkVirtualAssistance = lazyWithRetry(() => import('./uk-pages/VirtualAssistance'));
const UkDataEntry = lazyWithRetry(() => import('./uk-pages/DataEntry'));
const UkEcommerce = lazyWithRetry(() => import('./uk-pages/Ecommerce-accounting'));
const UkHealthcare = lazyWithRetry(() => import('./uk-pages/Healthcare'));
const UkLawFirms = lazyWithRetry(() => import('./uk-pages/LawFirms'));
const UkRealEstate = lazyWithRetry(() => import('./uk-pages/RealEstate'));
const UkHospitality = lazyWithRetry(() => import('./uk-pages/Hospitality'));
const UkBlog = lazyWithRetry(() => import('./uk-pages/Blog'));
const UkBlogDetails = lazyWithRetry(() => import('./uk-pages/BlogDetails'));
const UkContact = lazyWithRetry(() => import('./uk-pages/Contact'));
const UkPrivacy = lazyWithRetry(() => import('./uk-pages/PrivacyPolicy'));
const UkTerms = lazyWithRetry(() => import('./uk-pages/TermsofService'));
const UkContractors = lazyWithRetry(() => import('./uk-pages/Contractors'));
const UkManufacturing = lazyWithRetry(() => import('./uk-pages/Manufacturing'));
const UkNonProfit = lazyWithRetry(() => import('./uk-pages/Non-Profit'));
const UkRestaurant = lazyWithRetry(() => import('./uk-pages/Restaurant'));
const UkRetail = lazyWithRetry(() => import('./uk-pages/RetailBusiness'));
const UkController = lazyWithRetry(() => import('./uk-pages/ControllerService'));
const UkFinancialReporting = lazyWithRetry(() => import('./uk-pages/FinancialReporting'));
const UkInvoiceProcessing = lazyWithRetry(() => import('./uk-pages/InvoiceProcessing'));
const UkAccountingOutsourcing = lazyWithRetry(() => import('./uk-pages/AccountingOutsourcing'));
const UkTaxPlanning = lazyWithRetry(() => import('./uk-pages/TaxPlanning'));
const UkAddblog = lazyWithRetry(() => import('./uk-pages/Addblog'));
// CMS admin. Lazy so the editor, its MUI tables and the icon registry never land
// in a public page's chunk. Excluded from prerendering and from robots.txt.
const AdminApp = lazyWithRetry(() => import('./admin/AdminApp'));
// Renders any published CMS row through ServiceLayout. Mounted only under
// /cms-preview so a database row can be compared against the hard-coded
// component for the same URL before src/states/ is removed. Not indexable:
// excluded from prerendering and disallowed in robots.txt.
const CmsServicePage = lazyWithRetry(() => import('./pages/CmsServicePage'));

// The Delaware section layout, drawing the same database rows through the new
// ordered-section template. Lazy, so it keeps its own chunk and never lands in a
// public page's graph while it is being reviewed.
const DelawareServicePage = lazyWithRetry(() => import('./pages/DelawareServicePage'));

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import SocialBar from './components/SocialBar';
import { Box } from '@mui/material';
import { ConsultationProvider } from './components/ConsultationModal';

// SocialBar is marketing chrome for visitors. On /admin it floats over the
// editor's Publish button, so it is suppressed there. Lives inside <Router> so
// it can read the current path.
function SiteChrome() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/admin') || pathname.startsWith('/cms-preview')) return null;
  return <SocialBar />;
}

// Shell for the software sub-pages (QuickBooks, Xero, Wave), which are
// authored as bare content sections. Adds the shared navbar/footer and top
// clearance for the fixed navbar so they render as complete pages.
const SoftwareLayout = ({ children }) => (
  <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', position: 'relative' }}>
    <Navbar />
    <Box component="main" sx={{ pt: { xs: 10, md: 12 } }}>{children}</Box>
    <Footer />
    <ScrollToTop />
  </Box>
);

// Shown while a lazily-loaded route chunk is being fetched.
//
// On the first paint after a reload this is what the visitor sees, because the
// client boots un-hydrated (see index.jsx): render() empties #root and every
// route is lazy, so the tree suspends before anything of the page exists. The
// container it just emptied held the prerendered HTML for this exact URL, so
// when that snapshot is available it is shown verbatim — the finished page
// stays on screen, unchanged, until React can take over. That is the whole
// reason a reload no longer flashes a blank page with a spinner.
//
// Without a snapshot (a client-side navigation, or a route that was never
// prerendered) it falls back to a spinner under a <Navbar/>. The navbar is
// rendered explicitly: every page carries its own, so omitting it here would
// unmount and remount one across the fallback swap, blinking the logo.
const PageLoader = () => {
  const { pathname, search } = useLocation();
  const shell = prerenderedShellFor(pathname + search);

  // Static markup only — it is inert for the moment it is on screen, and it is
  // this build's own prerender output, never anything user-supplied.
  if (shell) return <div dangerouslySetInnerHTML={{ __html: shell }} />;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
      </Box>
    </Box>
  );
};

function ThemedApp() {
  const { mode } = useThemeMode();
  const theme = createAppTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ConsultationProvider>
      <Router>
        <ScrollToTopOnNavigate />
        <RouteErrorBoundary>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/us/software/tools-we-use/" element={<AccountingSoftware />} />
          <Route path="/us/software/bookkeeping-with-quickbook-desktop/" element={<SoftwareLayout><QuickBooksDesktop /></SoftwareLayout>} />
          <Route path="/us/software/bookkeeping-with-quickbook-online/" element={<SoftwareLayout><QuickBooksOnline /></SoftwareLayout>} />
          <Route path="/us/software/xero-for-small-business/" element={<SoftwareLayout><Xero /></SoftwareLayout>} />
          <Route path="/us/software/wave-accounting-for-small-business/" element={<SoftwareLayout><WaveAccounting /></SoftwareLayout>} />

          {/* ── UK site ── */}
          <Route path="/uk" element={<UkLayout />}>
            <Route index element={<UkHome />} />
            <Route path="about" element={<UkAbout />} />
            <Route path="why-choose-milta" element={<UkWhyMilta />} />
            <Route path="services" element={<UkServices />} />
            <Route path="bookkeeping-services-for-small-business" element={<UkBookKeeping />} />
            <Route path="accounts-payable-services-in-uk" element={<UkAccountsPayable />} />
            <Route path="accounts-receivable-services-in-uk" element={<UkAccountsReceivable />} />
            <Route path="best-digital-marketing-service-in-uk" element={<UkDigitalMarketing />} />
            <Route path="payroll-services-for-small-business" element={<UkPayroll />} />
            <Route path="virtual-assistant-services-in-the-uk" element={<UkVirtualAssistance />} />
            <Route path="accounting-data-entry-services-uk" element={<UkDataEntry />} />
            <Route path="ecommerce-accounting-service" element={<UkEcommerce />} />
            <Route path="accounting-services-for-healthcare" element={<UkHealthcare />} />
            <Route path="law-firm-accounting-services" element={<UkLawFirms />} />
            <Route path="accounting-services-for-real-estate" element={<UkRealEstate />} />
            <Route path="hospitality-accounting-services" element={<UkHospitality />} />
            <Route path="blogs" element={<UkBlog />} />
            <Route path="blogs/:slug" element={<UkBlogDetails />} />
            <Route path="contact" element={<UkContact />} />
            <Route path="privacy-policy" element={<UkPrivacy />} />
            <Route path="terms-of-service" element={<UkTerms />} />
            <Route path="accounting-services-for-contractors" element={<UkContractors />} />
            <Route path="accounting-services-for-manufacturing" element={<UkManufacturing />} />
            <Route path="accounting-services-for-non-profit" element={<UkNonProfit />} />
            <Route path="accounting-services-for-restaurants" element={<UkRestaurant />} />
            <Route path="accounting-services-for-retail-business" element={<UkRetail />} />
            <Route path="controller-services" element={<UkController />} />
            <Route path="financial-reporting-services" element={<UkFinancialReporting />} />
            <Route path="invoice-processing-services" element={<UkInvoiceProcessing />} />
            <Route path="accounting-outsourcing-services" element={<UkAccountingOutsourcing />} />
            <Route path="tax-planning-services" element={<UkTaxPlanning />} />
            <Route path="addblog" element={<UkAddblog />} />
          </Route>
          <Route path="/contact" element={<Contact />} />
          <Route path="/career" element={<Career />} />
          <Route path="/career/open-positions" element={<CareerSub />} />
          <Route path="/us/services/bookkeeping-company-in-the-usa/" element={<BookKeeping />} />
          <Route path="/us/services/tax-planning-and-preparation-services-usa/" element={<TaxPlanning />} />
          <Route path="/us/services/virtual-assistant-service-in-the-usa/" element={<VirtualAssistance />} />
          <Route path="/us/services/best-cpa-services-for-small-businesses-in-the-usa/" element={<CPAServices />} />
          <Route path="/us/services/financial-controller-services-in-the-usa/" element={<FinancialControllerServices />} />
          <Route path="/us/services/outsourcing-accounting-data-entry-services-in-the-usa/" element={<DataEntryServices />} />
          <Route path="/us/services/best-digital-marketing-agency-in-usa/" element={<DigitalMarketing />} />
          <Route path="/us/services/payroll-management-services-in-the-usa/" element={<PayrollManagement />} />
          <Route path="/us/industry/bookkeeping-for-contractors-companies/" element={<ContractorsCompanies />} />
          <Route path="/us/industry/accounting-services-for-lawfirms/" element={<LawFirms />} />
          <Route path="/us/industry/accounting-services-for-manufacturing/" element={<ManufacturingCompanies />} />
          <Route path="/us/industry/bookkeeping-for-real-estate-companies/" element={<RealEstateCompanies />} />
          <Route path="/us/industry/accounting-services-for-nonprofit-organizations/" element={<NonProfit />} />
          <Route path="/us/industry/accounting-services-for-healthcare/" element={<HealthCare />} />
          <Route path="/us/industry/accounting-services-for-restaurant-businesses/" element={<Restaurant />} />
          <Route path="/us/industry/accounting-services-for-retail-businesses/" element={<RetailBusiness />} />
          <Route path="/blogs" element={<Blog />} />
          <Route path="/us/blogs/:slug" element={<BlogDetails />} />
          <Route path="/areas-we-serve" element={<Areas />} />
          <Route path="/admin" element={<AdminApp />} />
          <Route path="/cms-preview/*" element={<CmsServicePage stripPrefix="/cms-preview" />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />

          {/* The Delaware section layout, rendering the same rows at a second
              URL so it can be compared against the live pages before it replaces
              them. Kept out of the index the same three ways /cms-preview is:
              EXCLUDE in prerender.mjs, Disallow in robots.txt, and the row's own
              canonical still points at the real URL.

              To cut Delaware over to the new layout, pass the layout to the
              catch-all below instead of adding routes here — the eight Delaware
              rows are matched by URL, not by route:
                <Route path="/us/services/*" element={<DelawareServicePage />} />
              which switches EVERY state page, so do it per-state only once the
              layout has been checked against more than Delaware. */}
          <Route path="/delaware-preview/*" element={<DelawareServicePage stripPrefix="/delaware-preview" />} />

          {/* ── All state service pages now served from Supabase ── */}
          {/* All /us/services/* paths are fetched from the Supabase database */}
          <Route path="/us/services/*" element={<CmsServicePage />} />

        </Routes>
        </Suspense>
        </RouteErrorBoundary>
        <SiteChrome />
      </Router>
      </ConsultationProvider>
    </ThemeProvider>
  );
}

function App() {
  return (
    <ThemeContextProvider>
      <ThemedApp />
    </ThemeContextProvider>
  );
}

export default App;
