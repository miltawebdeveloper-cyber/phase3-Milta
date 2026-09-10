// The state service-page templates — one file per service.
//
// A page's service decides which template shapes it. That decision is made on
// the server when a document is uploaded (serviceTemplates.templateFor reads
// db/templates/<service>.json); this is the same decision on the browser side,
// so a caller that knows a page's service can render it without knowing which
// file to reach for.
//
// Every service currently draws through the same layout, because what differs
// between services is which sections a page has and in what order — data, held
// in db/templates/, not code. The eight files exist so that each service has a
// place to diverge: a prop, a wrapper, a section override applied to one service
// changes that service's pages and no others.
//
// SERVICE NAMES ARE THE DATABASE'S. `pages.service` stores "Data Entry" and
// "Virtual Assistant" with the space; the keys below match exactly, so a lookup
// never needs a normalising step that could quietly miss.
import ServiceTemplateLayout from "./ServiceTemplateLayout";
// Every service is now a folder (./<Service>/index.jsx): fixed, document-
// order-driven layouts (see each folder's index.jsx header). Payroll was the
// last one still drawing through ./ServiceTemplateLayout as a single file;
// ServiceTemplateLayout itself is kept only as the fallback for a page whose
// service is blank or unrecognised.
import Bookkeeping from "./Bookkeeping";
import CPA from "./CPA";
import DataEntry from "./DataEntry";
import DigitalMarketing from "./DigitalMarketing";
import FinancialController from "./FinancialController";
import Payroll from "./Payroll";
import Tax from "./Tax";
import VirtualAssistant from "./VirtualAssistant";

export const SERVICE_TEMPLATES = {
  "Bookkeeping": Bookkeeping,
  "CPA": CPA,
  "Data Entry": DataEntry,
  "Digital Marketing": DigitalMarketing,
  "Financial Controller": FinancialController,
  "Payroll": Payroll,
  "Tax": Tax,
  "Virtual Assistant": VirtualAssistant,
};

// The template for a service, or the shared layout for a page whose service is
// blank or unrecognised. Never null: a page with an odd service still has to
// render, and it renders through the same sections either way.
export const templateFor = (service) =>
  SERVICE_TEMPLATES[String(service || "").trim()] || ServiceTemplateLayout;

export { default as ServiceTemplateLayout } from "./ServiceTemplateLayout";
export { default as planSections, typeOf, isEmptySection, CANONICAL_ORDER } from "./sections/planSections";
export { SECTION_COMPONENTS, componentFor } from "./sections/registry";
export { SECTIONS, SECTION_KEYS, sectionFor, blankFor, helpForKey, labelForKey, rankOf } from "./sections/manifest";

export default SERVICE_TEMPLATES;
