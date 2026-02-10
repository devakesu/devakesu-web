// Legal constants for devakesu.com
export const TERMS_VERSION = '1.0';
export const EFFECTIVE_DATE = '2026-02-09';
export const CONTACT_EMAIL = 'fusion@devakesu.com';
export const SITE_NAME = 'devakesu.com';

// ------------------------------------------------------------------
// PRIVACY POLICY
// ------------------------------------------------------------------
export const PRIVACY_POLICY = `
**Last Updated:** ${EFFECTIVE_DATE}

### Overview

This is a personal portfolio website. I respect your privacy and am transparent about what data is collected and how it's used.

### What Data is Collected

**Analytics (Active by Default):**
This site uses Google Analytics 4 via server-side Measurement Protocol to understand how visitors interact with the portfolio. **Google Signals is enabled**, which means:

* **Page views & behavior** - Which pages are visited, time on site, referral sources
* **Location data** - Country/region (not precise GPS location)
* **Device & browser** - Device type, operating system, browser version
* **Google Signals data** - If you're signed into a Google account, GA may:
  * Associate your visit across multiple devices (cross-device tracking)
  * Use your Google profile data for enhanced demographics and interests reporting
  * Share anonymized data with Google for ads personalization (even though this site doesn't run ads)
  * Link your activity to Google's advertising ecosystem

**Technical Data:**
* **Server logs** - IP address, browser type, access times (standard web server logs)
* **Cloudflare data** - CDN and security services may process request metadata

### What is NOT Collected Directly

* ❌ No personal information collected by me (name, email, phone)
* ❌ No user accounts or authentication on this site
* ❌ No first-party cookies set by this site
* ❌ No selling of your data to advertisers

**Important:** While I don't collect personal data, **Google Analytics with Google Signals enabled MAY associate your visit with your Google account** if you're signed in, which could include your name, email, and other Google profile information.

### How Data is Used

* Understanding which content resonates with visitors
* Improving site performance and user experience
* Monitoring for security issues

### Third-Party Services

**Google Analytics 4 (with Google Signals):**
* Analytics data is processed server-side using Google's Measurement Protocol
* **Google Signals is enabled**, which means Google may:
  * Collect data about signed-in Google users across devices
  * Use your data for ads personalization across Google's network
  * Associate your visit with your Google Advertising ID
* **This site does NOT set Google Analytics cookies (_ga, _gid) in your browser** because tracking is performed server-side
* Subject to [Google's Privacy Policy](https://policies.google.com/privacy) and [Google Advertising Features Policy](https://support.google.com/analytics/answer/2700409)
* **Opt-out options:**
  * [Google Analytics Opt-out Browser Add-on](https://tools.google.com/dlpage/gaoptout)
  * [Google Ads Settings](https://adssettings.google.com/)
  * [My Activity - Google Account](https://myactivity.google.com/)
  * Turn off "Ads Personalization" in your Google account settings

**Hetzner Online GmbH (Hosting):**
* VPS hosting infrastructure located in Germany/Finland (EU)
* Server logs may contain IP addresses and request metadata
* Subject to [Hetzner's Privacy Policy](https://www.hetzner.com/legal/privacy-policy)
* GDPR-compliant EU data center

**Cloudflare:**
* CDN, DDoS protection, DNS, and Web Application Firewall
* May process request metadata, IP addresses, and security cookies
* Subject to [Cloudflare's Privacy Policy](https://www.cloudflare.com/privacypolicy/)

### Your Rights

**Access & Transparency:** This is an open-source project. You can review the [source code on GitHub](https://github.com/devakesu/devakesu-web) to verify privacy practices.

**Opt-Out of Analytics:**
* **Block all tracking:** Use browser extensions like uBlock Origin, Privacy Badger, or browser built-in tracking protection
* **Opt-out of Google Analytics only:** Install the [Google Analytics Opt-out Add-on](https://tools.google.com/dlpage/gaoptout)
* **Opt-out of Google Signals/Ads:** Visit [Google Ads Settings](https://adssettings.google.com/) and turn off "Ads Personalization"
* **View/Delete Google Activity:** Manage your data at [myactivity.google.com](https://myactivity.google.com/)

**Data Deletion:** Since this is a portfolio site with no user accounts, there's no personal data stored by me to delete. However, Google Analytics retains data according to their retention policies. You can request deletion via [Google's Data Deletion Request](https://support.google.com/analytics/answer/9450800).

**Contact:** Questions or concerns? Email me at ${CONTACT_EMAIL}

### Data Retention

* Analytics data is retained according to Google Analytics 4 defaults (2-14 months)
* Server logs are rotated automatically and not retained long-term

### International Data Transfers & GDPR

This site is hosted on **Hetzner servers in Germany/Finland (EU jurisdiction)**, but data is processed by third parties globally:

* **Hetzner (Primary Hosting):** Germany/Finland (EU) - GDPR compliant
* **Cloudflare:** Global edge network (US company with EU data centers)
* **Google Analytics:** United States (US company under EU-U.S. Data Privacy Framework)

**For EU/EEA Visitors:**
* Your data is transferred to the United States (Google Analytics)
* Google complies with the EU-U.S. Data Privacy Framework
* You have rights under GDPR to access, rectify, and erase your data
* You can lodge a complaint with your local Data Protection Authority
* **Legal basis for processing:** Legitimate interest (understanding website usage) and consent (via continued use)

By using this website, you acknowledge and consent to these international data transfers.

### Changes to This Policy

I may update this privacy policy from time to time. Changes will be posted on this page with an updated revision date.

### GDPR Compliance (EU/EEA Visitors)

**Legal Basis:** Legitimate interest (Article 6(1)(f) GDPR) - understanding website performance and visitor behavior.

**Your Rights Under GDPR:**
* **Right to Access (Art. 15):** Request what data Google Analytics has collected about you
* **Right to Rectification (Art. 16):** Correct inaccurate data
* **Right to Erasure (Art. 17):** Request deletion via Google's data deletion tools
* **Right to Restriction (Art. 18):** Limit processing by opting out
* **Right to Object (Art. 21):** Object to analytics processing at any time
* **Right to Data Portability (Art. 20):** Export your Google Analytics data
* **Right to Withdraw Consent:** Opt-out anytime via Google Ads Settings

**Data Protection Officer:** As a personal portfolio, I don't have a DPO. Contact me directly at **${CONTACT_EMAIL}** for privacy inquiries.

**Supervisory Authority:** You have the right to lodge a complaint with your local Data Protection Authority if you believe your data protection rights have been violated.

### Children's Privacy

This site is not directed at children under 13. I do not knowingly collect data from children.
`;

// ------------------------------------------------------------------
// TERMS OF USE
// ------------------------------------------------------------------
// Function to generate Terms of Use with current year at render time
export function getTermsOfUse(year = new Date().getFullYear()) {
  return `
**Last Updated:** ${EFFECTIVE_DATE}

### Acceptance

By accessing ${SITE_NAME}, you agree to these terms. If you disagree, please do not use this site.

### Use License

This is a personal portfolio website. You may:
* ✅ Browse and view content
* ✅ Share links to this site
* ✅ Reference my work in your own projects (with attribution)

You may NOT:
* ❌ Scrape or copy content in bulk without permission
* ❌ Use this site for illegal activities
* ❌ Attempt to hack, disrupt, or compromise site security
* ❌ Claim my work as your own

### Open Source

The source code for this website is open source (available on GitHub). However:
* The code is provided "as is" without warranty
* You must comply with the repository's license terms
* Personal content (text, images, projects) remains my intellectual property

### Intellectual Property

* **Code:** Open source (see GitHub repository for license)
* **Content:** Personal writings, project descriptions, and images are © ${year} Devanarayanan
* **Trademarks:** Any mentioned trademarks belong to their respective owners

### External Links

This site contains links to external websites. I am not responsible for the content or privacy practices of those sites.

### Disclaimer

This portfolio is provided "as is" without warranties of any kind, either express or implied.

**NO LIABILITY:** I am not liable for any damages arising from your use of this site, including but not limited to:
* Technical errors or downtime
* Inaccuracies in content
* Security incidents

**EDUCATIONAL PURPOSE:** Project descriptions and technical information are shared for educational and informational purposes. Always verify information independently before making decisions.

### Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, I SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.

### Contact Projects

If you're contacting me about potential work or collaboration:
* I reserve the right to decline any inquiry
* No employment relationship is created by browsing this site
* Any submitted ideas/proposals remain your property unless otherwise agreed

### Governing Law

These terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in India.

### Changes

I may revise these terms at any time. Continued use of the site after changes constitutes acceptance.

### Contact

Questions about these terms? Email **${CONTACT_EMAIL}**
`;
}

// ------------------------------------------------------------------
// COOKIE NOTICE
// ------------------------------------------------------------------
export const COOKIE_NOTICE = `
**Last Updated:** ${EFFECTIVE_DATE}

### What Are Cookies?

Cookies are small text files stored on your device by websites you visit.

### Cookies Used on This Site

**Google Analytics (Server-Side Implementation):**
This site uses Google Analytics via **server-side Measurement Protocol**, which means:
* Google Analytics tracking is performed on the server, not in your browser
* **No Google Analytics cookies (_ga, _gid, etc.) are set by this site**
* If you previously visited a site that set GA cookies, those existing cookies may be read (but never modified or created) to maintain consistent analytics identifiers
* All GA requests happen server-side; your browser never contacts Google directly for analytics

**No First-Party Cookies Set by This Site:**
* ❌ No authentication cookies (no login system)
* ❌ No first-party advertising cookies
* ❌ No social media cookies

**Third-Party Cookies:**
Cloudflare may set security cookies (\`__cf_bm\`, \`__cf_clearance\`) for DDoS protection and bot detection.

### Managing Cookies

**Browser Settings:**
Most browsers allow you to:
* Block all cookies
* Delete existing cookies
* Block third-party cookies only

**Privacy Extensions:**
Consider using:
* uBlock Origin
* Privacy Badger
* Browser built-in tracking protection

### Do Not Track

This site does not specifically respond to Do Not Track (DNT) signals, but our minimal tracking approach means there's little to track anyway.

### Essential vs Optional

* **Essential:** None. This site functions without any cookies set by ${SITE_NAME}.
* **Analytics (Server-Side Only):** Google Analytics is implemented via server-side Measurement Protocol and does **not** set \`_ga\`, \`_gid\`, or other Google Analytics cookies in your browser.

### Contact

Questions about cookies? Email **${CONTACT_EMAIL}**
`;
