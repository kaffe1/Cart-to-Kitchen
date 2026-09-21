import {
  Accessibility,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Code2,
  LayoutGrid,
  MoreHorizontal,
  MousePointer2,
  Palette,
  Plus,
  Search,
  ShoppingBasket,
  Trash2,
  UserRound,
} from 'lucide-react';
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { FeedbackBanner } from '@/shared/components/ui/FeedbackBanner';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Progress, ProgressLabel, ProgressValue } from '@/shared/components/ui/progress';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Switch } from '@/shared/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { cn } from '@/shared/utils/cn';
import { formatSek, formatShortDate } from '@/shared/utils/format';

type ColorToken = {
  name: string;
  variable: string;
  value: string;
  role: string;
};

const semanticColors: ColorToken[] = [
  { name: 'Background', variable: '--background', value: '#f7f2e7', role: 'App canvas' },
  { name: 'Foreground', variable: '--foreground', value: '#17211e', role: 'Primary text' },
  { name: 'Card', variable: '--card', value: '#fffdf7', role: 'Card surface' },
  { name: 'Card foreground', variable: '--card-foreground', value: '#17211e', role: 'Text on cards' },
  { name: 'Popover', variable: '--popover', value: '#fffdf7', role: 'Floating surface' },
  { name: 'Popover foreground', variable: '--popover-foreground', value: '#17211e', role: 'Text on popovers' },
  { name: 'Primary', variable: '--primary', value: '#e5482c', role: 'Primary actions' },
  { name: 'Primary foreground', variable: '--primary-foreground', value: '#fffdf7', role: 'Text on primary' },
  { name: 'Secondary', variable: '--secondary', value: '#f1c453', role: 'Secondary actions' },
  { name: 'Secondary foreground', variable: '--secondary-foreground', value: '#17211e', role: 'Text on secondary' },
  { name: 'Muted', variable: '--muted', value: '#e9e3d5', role: 'Quiet surfaces' },
  { name: 'Muted foreground', variable: '--muted-foreground', value: '#66716c', role: 'Supporting text' },
  { name: 'Accent', variable: '--accent', value: '#d9ebdf', role: 'Selected accents' },
  { name: 'Accent foreground', variable: '--accent-foreground', value: '#174d3d', role: 'Text on accents' },
  { name: 'Destructive', variable: '--destructive', value: '#b42318', role: 'Danger and errors' },
  { name: 'Border', variable: '--border', value: '#d8d0bf', role: 'Dividers and outlines' },
  { name: 'Input', variable: '--input', value: '#d8d0bf', role: 'Control outlines' },
  { name: 'Ring', variable: '--ring', value: '#e5482c', role: 'Keyboard focus' },
];

const brandColors: ColorToken[] = [
  { name: 'Basil', variable: '--basil', value: '#155b48', role: 'Brand green' },
  { name: 'Tomato', variable: '--tomato', value: '#e5482c', role: 'Brand red' },
  { name: 'Saffron', variable: '--saffron', value: '#efb52f', role: 'Brand yellow' },
  { name: 'Ink', variable: '--ink', value: '#17211e', role: 'Hard outlines' },
  { name: 'Paper', variable: '--paper', value: '#fffdf7', role: 'Warm white surface' },
];

const spacingScale = [4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64];

const radii = [
  { name: 'sm', value: '0.495rem' },
  { name: 'md', value: '0.702rem' },
  { name: 'lg', value: '0.9rem' },
  { name: 'xl', value: '1.26rem' },
  { name: '2xl', value: '1.62rem' },
  { name: '3xl', value: '2.025rem' },
  { name: '4xl', value: '2.475rem' },
];

const sections = [
  ['principles', 'Principles'],
  ['colors', 'Color'],
  ['typography', 'Typography'],
  ['spacing-shape', 'Spacing & shape'],
  ['layout-motion', 'Layout & motion'],
  ['buttons', 'Buttons'],
  ['badges-avatars', 'Badges & avatars'],
  ['forms', 'Form controls'],
  ['status', 'Progress & loading'],
  ['tabs', 'Tabs'],
  ['feedback', 'Feedback & states'],
  ['shell', 'App shell'],
  ['utilities', 'Utilities & source map'],
  ['accessibility', 'Accessibility'],
] as const;

const componentSources = [
  ['AppShell', 'shared/components/layout/AppShell.tsx', 'Global navigation, wallet and cart status'],
  ['Avatar', 'shared/components/ui/avatar.tsx', 'Image, fallback, badge and group composition'],
  ['Badge', 'shared/components/ui/badge.tsx', 'Compact status and category labels'],
  ['Button', 'shared/components/ui/button.tsx', 'All application actions'],
  ['FeedbackBanner', 'shared/components/ui/FeedbackBanner.tsx', 'Info, success and error messages'],
  ['Input', 'shared/components/ui/input.tsx', 'Text-like form input'],
  ['Label', 'shared/components/ui/label.tsx', 'Accessible control labels'],
  ['Progress', 'shared/components/ui/progress.tsx', 'Value, label, track and indicator'],
  ['Skeleton', 'shared/components/ui/skeleton.tsx', 'Content-shaped loading placeholders'],
  ['Switch', 'shared/components/ui/switch.tsx', 'Immediate boolean settings'],
  ['Tabs', 'shared/components/ui/tabs.tsx', 'Default and line navigation variants'],
] as const;

const avatarImage =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"%3E%3Crect width="80" height="80" fill="%23155b48"/%3E%3Ccircle cx="40" cy="31" r="15" fill="%23f1c453"/%3E%3Cpath d="M14 80c2-22 12-31 26-31s24 9 26 31" fill="%23fffdf7"/%3E%3C/svg%3E';

function SectionHeader({ kicker, title, description }: { kicker: string; title: string; description: string }) {
  return (
    <div className="ds-section-heading">
      <span className="eyebrow">{kicker}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function ColorGrid({ tokens }: { tokens: ColorToken[] }) {
  return (
    <div className="ds-color-grid">
      {tokens.map((token) => (
        <article key={token.variable} className="ds-color-token">
          <span className="ds-color-swatch" style={{ background: `var(${token.variable})` }} />
          <div><strong>{token.name}</strong><small>{token.role}</small></div>
          <code>{token.variable}</code>
          <code>{token.value}</code>
        </article>
      ))}
    </div>
  );
}

export function DesignSystemPage() {
  return (
    <div className="page-shell design-system-page">
      <header className="ds-hero">
        <div>
          <span className="eyebrow"><Code2 size={14} /> Development only · v0.1</span>
          <h1>Cart to Kitchen<br />design system</h1>
          <p>The complete living reference for the frontend visual language, shared UI components, interaction states and implementation rules currently in the repository.</p>
        </div>
        <div className="ds-hero-stamp" aria-label="Design system status">
          <Badge>DEV ROUTE</Badge><strong>Warm utility</strong><span>Friendly, tactile and food-led</span>
        </div>
      </header>

      <div className="ds-book-layout">
        <aside className="ds-toc" aria-label="Design system chapters">
          <span>On this page</span>
          <nav>{sections.map(([id, label], index) => <a key={id} href={`#${id}`}><b>{String(index + 1).padStart(2, '0')}</b>{label}</a>)}</nav>
        </aside>

        <div className="ds-book-content">
          <section id="principles" className="ds-section">
            <SectionHeader kicker="01 · Foundations" title="Design principles" description="The visual system should make a practical shopping tool feel warm, legible and confidently playful." />
            <div className="ds-principle-grid">
              <article><Palette /><b>Warm, not clinical</b><p>Paper-like surfaces and food colors replace cold dashboard neutrals.</p></article>
              <article><MousePointer2 /><b>Tactile, not ornamental</b><p>Offset shadows and asymmetric corners signal interactive hierarchy.</p></article>
              <article><LayoutGrid /><b>Dense, not crowded</b><p>Compact controls keep shopping information visible without losing rhythm.</p></article>
              <article><Accessibility /><b>Expressive and usable</b><p>Color never carries meaning alone; labels, icons and focus states stay explicit.</p></article>
            </div>
            <div className="ds-do-dont">
              <article><CheckCircle2 /><div><b>Do</b><p>Use semantic tokens and shared components before adding feature-specific styles.</p></div></article>
              <article><CircleAlert /><div><b>Avoid</b><p>Do not introduce raw brand hex values or a new component for a one-off visual tweak.</p></div></article>
            </div>
          </section>

          <section id="colors" className="ds-section">
            <SectionHeader kicker="02 · Foundations" title="Color system" description="Semantic tokens power components; brand aliases support expressive feature layouts. Every token currently defined in globals.css is listed here." />
            <h3 className="ds-subheading">Semantic tokens</h3><ColorGrid tokens={semanticColors} />
            <h3 className="ds-subheading">Brand aliases</h3><ColorGrid tokens={brandColors} />
            <div className="ds-usage-notes">
              <div><code>primary</code><span>Main calls to action, active emphasis</span></div>
              <div><code>basil</code><span>Navigation and large branded surfaces</span></div>
              <div><code>saffron</code><span>Highlights, decisions and warm emphasis</span></div>
              <div><code>destructive</code><span>Errors and irreversible actions only</span></div>
            </div>
          </section>

          <section id="typography" className="ds-section">
            <SectionHeader kicker="03 · Foundations" title="Typography" description="Inter/system sans is the interface face; the system monospace stack is reserved for tokens, paths and technical values." />
            <div className="ds-type-list">
              <article><span>Display · 48–88px / 0.95</span><h1>Choose well.<br />Cook more.</h1><code>font-weight: 900 · tracking: -0.065em</code></article>
              <article><span>Page title · 35–74px / 0.94</span><h2 className="ds-page-title">Your weekly store</h2><code>font-weight: 900 · tracking: -0.065em</code></article>
              <article><span>Section heading · 27px</span><h2>Kitchen essentials</h2><code>font-weight: 700 · tracking: -0.04em</code></article>
              <article><span>Card heading · 20px</span><h3>Fresh ingredients</h3><code>font-weight: 700 · tracking: -0.03em</code></article>
              <article><span>Body · 16px / 1.5</span><p>Readable interface copy explains the next action in short, direct sentences.</p><code>font-weight: 400</code></article>
              <article><span>UI label · 14px</span><p className="ds-label-specimen">Add selected item</p><code>font-weight: 650–800</code></article>
              <article><span>Eyebrow · 11.5px</span><p className="eyebrow">Store overview</p><code>uppercase · tracking: 0.12em</code></article>
              <article><span>Code · 12.5px</span><code className="ds-code-specimen">shared/components/ui/button.tsx</code><code>ui-monospace</code></article>
            </div>
          </section>

          <section id="spacing-shape" className="ds-section">
            <SectionHeader kicker="04 · Foundations" title="Spacing, radius and elevation" description="A 4px base rhythm supports compact controls and spacious page composition. Large feature cards use an asymmetric bottom-right corner." />
            <h3 className="ds-subheading">Working spacing scale</h3>
            <div className="ds-spacing-scale">{spacingScale.map((space) => <div key={space}><span style={{ width: `${space}px` }} /><code>{space}px</code></div>)}</div>
            <h3 className="ds-subheading">Tailwind radius tokens</h3>
            <div className="ds-radius-grid">
              {radii.map((radius) => <article key={radius.name}><span style={{ borderRadius: radius.value }} /><b>radius-{radius.name}</b><code>{radius.value}</code></article>)}
              <article><span className="ds-radius-pill" /><b>pill</b><code>999px</code></article>
              <article><span className="ds-radius-brand" /><b>brand card</b><code>28 / 28 / 12 / 28</code></article>
            </div>
            <h3 className="ds-subheading">Elevation recipes</h3>
            <div className="ds-elevation-grid">
              <article className="ds-elevation-flat"><b>Flat</b><span>Border only</span></article>
              <article className="ds-elevation-soft"><b>Soft</b><span>Ambient app panels</span></article>
              <article className="ds-elevation-solid"><b>Solid offset</b><span>Decisions and key emphasis</span></article>
            </div>
          </section>

          <section id="layout-motion" className="ds-section">
            <SectionHeader kicker="05 · Foundations" title="Layout, icons and motion" description="The page frame scales from a 1480px desktop canvas to a single-column mobile layout. Lucide is the functional icon language." />
            <div className="ds-layout-facts">
              <article><strong>1480px</strong><span>Maximum application width</span></article><article><strong>40px</strong><span>Desktop outer gutter</span></article><article><strong>24px</strong><span>Mobile outer gutter</span></article><article><strong>74px</strong><span>Desktop app header</span></article>
            </div>
            <div className="ds-breakpoint-table">
              <div><b>≤ 1180px</b><span>Store grid reduces to three cards; cart narrows.</span></div>
              <div><b>≤ 900px</b><span>Desktop navigation becomes bottom navigation; store stacks.</span></div>
              <div><b>≤ 680px</b><span>Gutters tighten, toolbar stacks and catalog becomes two columns.</span></div>
              <div><b>≤ 440px</b><span>Auth content compresses and design tokens become one column.</span></div>
            </div>
            <div className="ds-split-demo">
              <article><h3>Icon scale</h3><div className="ds-icon-scale"><span><ShoppingBasket size={14} /><code>14</code></span><span><ShoppingBasket size={16} /><code>16</code></span><span><ShoppingBasket size={20} /><code>20</code></span><span><ShoppingBasket size={24} /><code>24</code></span><span><ShoppingBasket size={32} /><code>32</code></span></div><p>Use 16–20px in controls, 24px for section cues and larger icons only as illustration.</p></article>
              <article><h3>Motion</h3><div className="ds-motion-card"><ArrowRight /><b>Hover this card</b><span>160ms ease · translateY(-3px)</span></div><p>Motion confirms hierarchy. Reduced-motion preferences collapse animation and smooth scrolling to 0.01ms.</p></article>
            </div>
          </section>

          <section id="buttons" className="ds-section">
            <SectionHeader kicker="06 · Components" title="Button" description="Use a button for actions, never for navigation. Default is the primary action; only one primary action should dominate a local region." />
            <div className="ds-component-block"><h3>Variants</h3><div className="ds-component-row"><Button>Default</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="destructive"><Trash2 data-icon="inline-start" />Destructive</Button><Button variant="link">Link</Button></div></div>
            <div className="ds-component-block"><h3>Text sizes</h3><div className="ds-component-row ds-align-end"><Button size="xs"><Plus data-icon="inline-start" />Extra small</Button><Button size="sm"><Plus data-icon="inline-start" />Small</Button><Button><Plus data-icon="inline-start" />Default</Button><Button size="lg">Large<ArrowRight data-icon="inline-end" /></Button></div></div>
            <div className="ds-component-block"><h3>Icon sizes and states</h3><div className="ds-component-row ds-align-end"><Button size="icon-xs" aria-label="Add item, extra small"><Plus /></Button><Button size="icon-sm" aria-label="Add item, small"><Plus /></Button><Button size="icon" aria-label="Add item"><Plus /></Button><Button size="icon-lg" aria-label="Add item, large"><Plus /></Button><Button disabled>Disabled</Button><Button aria-invalid="true">Invalid</Button></div></div>
          </section>

          <section id="badges-avatars" className="ds-section">
            <SectionHeader kicker="07 · Components" title="Badge and avatar" description="Badges label compact metadata. Avatars represent people or group membership and always require a meaningful fallback." />
            <div className="ds-split-demo">
              <article><h3>All badge variants</h3><div className="ds-component-row"><Badge><Check data-icon="inline-start" />Default</Badge><Badge variant="secondary">Secondary</Badge><Badge variant="destructive">Destructive</Badge><Badge variant="outline">Outline</Badge><Badge variant="ghost">Ghost</Badge><Badge variant="link">Link</Badge></div></article>
              <article><h3>Avatar sizes and composition</h3><div className="ds-component-row ds-align-end"><Avatar size="sm"><AvatarFallback>SM</AvatarFallback></Avatar><Avatar><AvatarImage src={avatarImage} alt="Demo profile" /><AvatarFallback>CK</AvatarFallback></Avatar><Avatar size="lg"><AvatarFallback>LG</AvatarFallback><AvatarBadge><Check /></AvatarBadge></Avatar><AvatarGroup><Avatar><AvatarFallback>AM</AvatarFallback></Avatar><Avatar><AvatarFallback>SK</AvatarFallback></Avatar><Avatar><AvatarFallback>JP</AvatarFallback></Avatar><AvatarGroupCount>+4</AvatarGroupCount></AvatarGroup></div></article>
            </div>
          </section>

          <section id="forms" className="ds-section">
            <SectionHeader kicker="08 · Components" title="Input, label and switch" description="Labels are always visible and linked with htmlFor. Placeholder text is an example, never the only description of a field." />
            <div className="ds-form-grid">
              <div className="form-field"><Label htmlFor="ds-default">Default</Label><Input id="ds-default" placeholder="Search ingredients" /></div>
              <div className="form-field"><Label htmlFor="ds-value">With value</Label><Input id="ds-value" defaultValue="Cherry tomatoes" /></div>
              <div className="form-field"><Label htmlFor="ds-disabled">Disabled</Label><Input id="ds-disabled" defaultValue="Unavailable" disabled /></div>
              <div className="form-field"><Label htmlFor="ds-invalid">Invalid</Label><Input id="ds-invalid" defaultValue="not-an-email" aria-invalid="true" aria-describedby="ds-invalid-note" /><small id="ds-invalid-note" className="ds-error-text">Enter a valid email address.</small></div>
              <div className="form-field"><Label htmlFor="ds-search">With leading icon</Label><div className="ds-input-with-icon"><Search size={16} /><Input id="ds-search" placeholder="Search" /></div></div>
              <div className="form-field"><Label htmlFor="ds-file">File input</Label><Input id="ds-file" type="file" /></div>
            </div>
            <div className="ds-component-block"><h3>Switch sizes and states</h3><div className="ds-switch-grid">
              <div><span><b>Default off</b><small>Setting is inactive</small></span><Switch aria-label="Default off" /></div>
              <div><span><b>Default on</b><small>Setting is active</small></span><Switch defaultChecked aria-label="Default on" /></div>
              <div><span><b>Small off / on</b><small>For compact rows</small></span><span className="ds-component-row"><Switch size="sm" aria-label="Small off" /><Switch size="sm" defaultChecked aria-label="Small on" /></span></div>
              <div><span><b>Disabled</b><small>Read-only state</small></span><Switch disabled aria-label="Disabled switch" /></div>
            </div></div>
          </section>

          <section id="status" className="ds-section">
            <SectionHeader kicker="09 · Components" title="Progress and skeleton" description="Progress communicates a known amount; skeletons reserve the final content shape while an unknown-duration request loads." />
            <div className="ds-split-demo">
              <article><h3>Progress compositions</h3><div className="ds-progress-stack"><Progress value={18} /><Progress value={55}><ProgressLabel>Weekly budget</ProgressLabel><ProgressValue /></Progress><Progress value={100}><ProgressLabel>Complete</ProgressLabel><ProgressValue /></Progress></div></article>
              <article><h3>Content-shaped skeletons</h3><div className="ds-skeleton-card"><Skeleton className="size-10 rounded-full" /><div><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div><div className="ds-skeleton-grid"><Skeleton /><Skeleton /><Skeleton /></div></article>
            </div>
          </section>

          <section id="tabs" className="ds-section">
            <SectionHeader kicker="10 · Components" title="Tabs" description="Tabs switch between peer views without changing the main task. The default variant is contained; line is lighter for content sections." />
            <div className="ds-split-demo">
              <article><h3>Default</h3><Tabs defaultValue="pantry"><TabsList><TabsTrigger value="pantry">Pantry</TabsTrigger><TabsTrigger value="list">Shopping list</TabsTrigger><TabsTrigger value="disabled" disabled>Disabled</TabsTrigger></TabsList><TabsContent value="pantry"><div className="ds-tab-panel">12 ingredients are ready to cook.</div></TabsContent><TabsContent value="list"><div className="ds-tab-panel">4 items remain on the list.</div></TabsContent></Tabs></article>
              <article><h3>Line</h3><Tabs defaultValue="details"><TabsList variant="line"><TabsTrigger value="details">Details</TabsTrigger><TabsTrigger value="nutrition">Nutrition</TabsTrigger><TabsTrigger value="notes">Notes</TabsTrigger></TabsList><TabsContent value="details"><div className="ds-tab-panel">Use for lower-emphasis content navigation.</div></TabsContent><TabsContent value="nutrition"><div className="ds-tab-panel">Nutrition panel content.</div></TabsContent><TabsContent value="notes"><div className="ds-tab-panel">Notes panel content.</div></TabsContent></Tabs></article>
            </div>
          </section>

          <section id="feedback" className="ds-section">
            <SectionHeader kicker="11 · Components" title="Feedback and page states" description="Feedback is placed beside the action it describes. Empty, loading, error and success states always explain what happens next." />
            <div className="ds-feedback-stack"><FeedbackBanner tone="info">Your cart is saved locally in this frontend prototype.</FeedbackBanner><FeedbackBanner tone="success">The ingredient was added to your kitchen.</FeedbackBanner><FeedbackBanner tone="error">The request could not be completed. Try again.</FeedbackBanner></div>
            <div className="ds-state-grid">
              <article><span>🧺</span><b>Empty</b><p>No items yet. Add an ingredient to begin.</p><Button size="sm">Browse store</Button></article>
              <article><MoreHorizontal /><b>Loading</b><p>Preserve layout and describe long waits.</p><Skeleton className="h-3 w-2/3" /></article>
              <article><CircleAlert /><b>Error</b><p>Explain the problem and offer a recovery action.</p><Button size="sm" variant="outline">Try again</Button></article>
              <article><CheckCircle2 /><b>Success</b><p>Confirm the result without blocking the next task.</p><Badge variant="secondary">Saved</Badge></article>
            </div>
          </section>

          <section id="shell" className="ds-section">
            <SectionHeader kicker="12 · Patterns" title="Application shell" description="AppShell is the authenticated frame already surrounding this page. It owns global navigation and cross-feature status, never feature business logic." />
            <div className="ds-shell-anatomy"><div className="ds-shell-bar"><span className="brand-mark"><ShoppingBasket size={18} /></span><span className="ds-shell-links"><i>Store</i><i>Kitchen</i><i>Me</i></span><span className="ds-shell-actions"><i>750 SEK</i><i><ShoppingBasket size={14} /></i></span></div><div className="ds-shell-main">Route content</div></div>
            <ol className="ds-anatomy-list"><li><b>Brand lockup</b><span>Always returns to the Store route.</span></li><li><b>Primary navigation</b><span>Shows active route; moves to a fixed bottom bar at 900px.</span></li><li><b>Global status</b><span>Wallet, cart count and shopping-note count come from the AppShell presenter.</span></li><li><b>Route content</b><span>Feature views render inside main; auth intentionally renders outside the shell.</span></li></ol>
          </section>

          <section id="utilities" className="ds-section">
            <SectionHeader kicker="13 · Implementation" title="Utilities and source map" description="Shared utilities keep class composition and Swedish currency/date presentation consistent across presenters and views." />
            <div className="ds-utility-grid"><article><code>formatSek(249)</code><strong>{formatSek(249)}</strong><span>Swedish kronor, no fractional digits</span></article><article><code>formatShortDate(value)</code><strong>{formatShortDate('2026-09-21T18:30:00+02:00')}</strong><span>Compact English/Swedish-locale date and time</span></article><article><code>{"cn('base', 'active')"}</code><strong>{cn('base', 'active')}</strong><span>Tailwind-aware class merging</span></article></div>
            <div className="ds-source-table"><div className="ds-source-head"><b>Export</b><b>Source</b><b>Purpose</b></div>{componentSources.map(([name, source, purpose]) => <div key={name}><strong>{name}</strong><code>{source}</code><span>{purpose}</span></div>)}</div>
          </section>

          <section id="accessibility" className="ds-section">
            <SectionHeader kicker="14 · Quality bar" title="Accessibility checklist" description="These rules are part of the design system, not a final QA pass. Shared components provide the base; each feature must supply correct meaning and labels." />
            <div className="ds-checklist">
              <div><Check /><span><b>Keyboard</b> All actions remain reachable with a visible focus ring.</span></div><div><Check /><span><b>Names</b> Icon-only buttons receive an explicit aria-label.</span></div><div><Check /><span><b>Forms</b> Every input has a persistent linked label and inline error text.</span></div><div><Check /><span><b>Status</b> Errors use role=alert; passive feedback uses role=status.</span></div><div><Check /><span><b>Color</b> Meaning is repeated through text, icon or structure.</span></div><div><Check /><span><b>Motion</b> prefers-reduced-motion disables non-essential transition time.</span></div><div><Check /><span><b>Responsive</b> Controls stay comfortably tappable and content never relies on hover.</span></div><div><Check /><span><b>Semantics</b> Links navigate; buttons change state or submit an action.</span></div>
            </div>
            <div className="ds-end-note"><UserRound /><p><b>Owner rule:</b> when a shared visual pattern appears for the third time, document it here and promote it to <code>shared/components</code>.</p><ChevronRight /></div>
          </section>
        </div>
      </div>
    </div>
  );
}
