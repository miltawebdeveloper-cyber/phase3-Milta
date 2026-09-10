// Section type -> component.
//
// The layout renders whatever the plan lists; it never names a component. That
// is what makes the order data rather than code: adding a section type is a new
// folder and one line here, and the CMS can then place it anywhere on the page
// without the layout being touched.
//
// A type with no entry here is skipped rather than thrown on, so a row saved
// with a section this build does not know about loses that block, not the page.
import Banner from "./Banner";
import Intro from "./Intro";
import Prose from "./Prose";
import Checklist from "./Checklist";
import FeatureCards from "./FeatureCards";
import CardGrid from "./CardGrid";
import Advantages from "./Advantages";
import ComparisonTable from "./ComparisonTable";
import Industries from "./Industries";
import Faqs from "./Faqs";

export const SECTION_COMPONENTS = {
  banner: Banner,
  intro: Intro,
  prose: Prose,
  checklist: Checklist,
  featureCards: FeatureCards,
  cards: CardGrid,
  advantages: Advantages,
  table: ComparisonTable,
  industries: Industries,
  faqs: Faqs,
};

export const componentFor = (type) => SECTION_COMPONENTS[type] || null;

export default SECTION_COMPONENTS;
