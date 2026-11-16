// A short fade-in for the page you navigate to (styles in app/globals.css,
// "Page transitions").
//
// Next renders each page in its own <Activity>: a page you leave stays
// mounted but hidden (display: none), and a CSS animation starts over
// whenever its element is shown again. So animating the page's content
// fades in both new pages and ones you've visited before. Each route level
// whose pages swap on navigation re-exports this as its template.tsx, which
// sits right inside that Activity. When an outer level swaps, the inner
// levels' content fades with it.
//
// The page's fixed header is left out of the fade, so it just switches to
// the new page's header; the tab bar isn't part of the page at all.
//
// Not React's <ViewTransition>: while any view transition runs, iOS 26 can't
// see the fixed header when it colors the status bar area, so the top of the
// screen flashes to its soft blur for the length of the fade.
export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="page-transition">{children}</div>;
}
