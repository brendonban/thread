import Script from "next/script";
import markup from "./markup";

// The site is one page with hash routes (#research, #blog, #admin ...).
// Its markup and script are generated from design/thread.html by design/build_next.py.
export default function Page() {
  return (
    <>
      <div id="site-root" dangerouslySetInnerHTML={{ __html: markup }} suppressHydrationWarning />
      <Script src="/site.js" strategy="afterInteractive" />
    </>
  );
}
