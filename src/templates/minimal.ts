// MINIMAL TEMPLATE
// Premium design with dark/light mode, subtle animations, refined typography

interface Refinements {
  serviceImages?: boolean;
  serviceDescriptions?: boolean;
  showGallery?: boolean;
  darkModeToggle?: boolean;
  notes?: string;
}

interface TemplateData {
  business: string;
  tagline: string;
  description: string;
  services: string[];
  aboutText: string;
  phone: string;
  email: string;
  address: string;
  logoBase64: string | null;
  originalUrl: string;
  heroImage: string | null;
  galleryImages: string[];
  industry: string;
  businessType: string;
  refinements?: Refinements;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundAlt: string;
    text: string;
    textMuted: string;
  };
}

export function generateMinimalTemplate(data: TemplateData): string {
  const {
    business,
    tagline,
    description,
    services,
    aboutText,
    phone,
    email,
    address,
    logoBase64,
    originalUrl,
    heroImage,
    galleryImages,
    industry,
    businessType,
    palette,
  } = data;

  // Refinements with defaults
  const refinements = {
    serviceImages: true,
    serviceDescriptions: true,
    showGallery: true,
    darkModeToggle: true,
    ...data.refinements
  };

  const hasServices = services.length > 0;
  // Use gallery images as service backgrounds when refinement is enabled
  const serviceImagesForBg = (refinements.serviceImages && galleryImages.length > 0) ? galleryImages : [];
  const servicesHtml = hasServices ? services.slice(0, 6).map((service, i) => {
    const bgImage = serviceImagesForBg[i % (serviceImagesForBg.length || 1)];
    const hasBgImage = refinements.serviceImages && !!bgImage;
    const showDesc = refinements.serviceDescriptions;
    return `
            <div class="service ${hasBgImage ? 'has-image' : ''}" style="--delay: ${(i * 0.1).toFixed(1)}s${hasBgImage ? `; --bg-image: url('${bgImage}')` : ''}">
              ${hasBgImage ? '<div class="service-bg"></div>' : ''}
              <div class="service-content">
                <div class="service-icon">${getServiceIcon(service, industry)}</div>
                <h3>${service}</h3>
                ${showDesc ? `<p class="service-desc">${getServiceDescription(service, industry)}</p>` : ''}
              </div>
            </div>`;
  }).join('') : '';

  const logoHtml = logoBase64
    ? `<img src="${logoBase64}" alt="${business}" class="logo-img" />`
    : `<span class="logo-text">${business}</span>`;

  const hasGallery = galleryImages.length >= 2;
  const galleryHtml = hasGallery ? `
    <section class="gallery" id="gallery">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-number">03</span>
          <h2>Our Space</h2>
        </div>
        <div class="gallery-grid">
          ${galleryImages.slice(0, 4).map((img, i) => `
            <div class="gallery-item reveal" style="--delay: ${(i * 0.1).toFixed(1)}s">
              <img src="${img}" alt="${business}" loading="lazy" />
              <div class="gallery-overlay"></div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>` : '';

  const themeToggleHtml = refinements.darkModeToggle ? `
          <button class="theme-toggle" aria-label="Toggle theme">
            <svg class="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
            <svg class="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </button>` : '';

  const contactItems = [];
  if (phone) {
    contactItems.push(`
      <a href="tel:${phone.replace(/\s/g, '')}" class="contact-card reveal">
        <div class="contact-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </div>
        <div class="contact-info">
          <span class="contact-label">Call us</span>
          <span class="contact-value">${formatPhone(phone)}</span>
        </div>
        <svg class="contact-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>`);
  }
  if (email) {
    contactItems.push(`
      <a href="mailto:${email}" class="contact-card reveal" style="--delay: 0.1s">
        <div class="contact-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>
          </svg>
        </div>
        <div class="contact-info">
          <span class="contact-label">Email us</span>
          <span class="contact-value">${email}</span>
        </div>
        <svg class="contact-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>`);
  }
  if (address) {
    contactItems.push(`
      <div class="contact-card reveal" style="--delay: 0.2s">
        <div class="contact-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div class="contact-info">
          <span class="contact-label">Visit us</span>
          <span class="contact-value">${address}</span>
        </div>
      </div>`);
  }

  const cleanUrl = originalUrl.replace('https://', '').replace('http://', '').replace(/\/$/, '');

  return `---
// Generated by Garage Web
// Original: ${cleanUrl}
// Generated: ${new Date().toISOString()}
export const prerender = true;
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${business}${businessType !== 'Professional Services' ? ` — ${businessType}` : ''}</title>
    <meta name="description" content="${description || tagline || business}" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
      :root {
        --primary: ${palette.primary};
        --primary-rgb: ${hexToRgb(palette.primary)};
        --secondary: ${palette.secondary};
        --accent: ${palette.accent};

        /* Light mode */
        --bg: #ffffff;
        --bg-alt: #f8fafc;
        --bg-elevated: #ffffff;
        --text: #0f172a;
        --text-muted: #64748b;
        --border: rgba(0,0,0,0.06);
        --shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
        --shadow-lg: 0 4px 6px rgba(0,0,0,0.02), 0 12px 40px rgba(0,0,0,0.06);
      }

      [data-theme="dark"] {
        --bg: #0a0a0b;
        --bg-alt: #111113;
        --bg-elevated: #18181b;
        --text: #fafafa;
        --text-muted: #a1a1aa;
        --border: rgba(255,255,255,0.06);
        --shadow: 0 1px 3px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15);
        --shadow-lg: 0 4px 6px rgba(0,0,0,0.1), 0 12px 40px rgba(0,0,0,0.25);
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      html {
        scroll-behavior: smooth;
      }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background: var(--bg);
        color: var(--text);
        line-height: 1.6;
        -webkit-font-smoothing: antialiased;
        transition: background 0.4s ease, color 0.4s ease;
        overflow-x: hidden;
      }

      ::selection {
        background: var(--primary);
        color: white;
      }

      .container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 clamp(20px, 5vw, 48px);
      }

      /* ===== NAVIGATION ===== */
      nav {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        padding: 20px 0;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }

      nav::before {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--bg);
        opacity: 0;
        transition: opacity 0.4s ease;
        border-bottom: 1px solid transparent;
      }

      nav.scrolled::before {
        opacity: 0.85;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-bottom-color: var(--border);
      }

      nav .container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
      }

      .logo {
        display: flex;
        align-items: center;
        text-decoration: none;
        color: inherit;
        z-index: 1;
      }

      .logo-img {
        height: 44px;
        width: auto;
        object-fit: contain;
        transition: transform 0.3s ease;
      }

      .logo:hover .logo-img {
        transform: scale(1.02);
      }

      .logo-text {
        font-weight: 600;
        font-size: 18px;
        letter-spacing: -0.3px;
      }

      .nav-links {
        display: flex;
        gap: 36px;
        list-style: none;
        position: relative;
        z-index: 1;
      }

      .nav-links a {
        color: var(--text-muted);
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: color 0.2s ease;
        position: relative;
      }

      .nav-links a::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 0;
        width: 0;
        height: 1.5px;
        background: var(--primary);
        transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .nav-links a:hover {
        color: var(--text);
      }

      .nav-links a:hover::after {
        width: 100%;
      }

      .nav-right {
        display: flex;
        align-items: center;
        gap: 16px;
        z-index: 1;
      }

      .theme-toggle {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        border: 1px solid var(--border);
        background: var(--bg-elevated);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        color: var(--text-muted);
      }

      .theme-toggle:hover {
        border-color: var(--primary);
        color: var(--primary);
        transform: scale(1.05);
      }

      .theme-toggle svg {
        width: 18px;
        height: 18px;
        transition: transform 0.3s ease;
      }

      .theme-toggle:hover svg {
        transform: rotate(15deg);
      }

      .sun-icon { display: none; }
      .moon-icon { display: block; }
      [data-theme="dark"] .sun-icon { display: block; }
      [data-theme="dark"] .moon-icon { display: none; }

      .nav-cta {
        background: var(--primary);
        color: white;
        padding: 12px 24px;
        border-radius: 10px;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        overflow: hidden;
      }

      .nav-cta::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, transparent, rgba(255,255,255,0.1));
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .nav-cta:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(var(--primary-rgb), 0.3);
      }

      .nav-cta:hover::before {
        opacity: 1;
      }

      /* ===== HERO ===== */
      .hero {
        min-height: 100vh;
        display: flex;
        align-items: center;
        padding: 140px 0 120px;
        position: relative;
        overflow: hidden;
      }

      .hero-bg {
        position: absolute;
        inset: 0;
        z-index: -1;
      }

      .hero-gradient {
        position: absolute;
        width: 800px;
        height: 800px;
        border-radius: 50%;
        filter: blur(120px);
        opacity: 0.12;
        animation: float 20s ease-in-out infinite;
      }

      .hero-gradient-1 {
        background: var(--primary);
        top: -20%;
        right: -10%;
      }

      .hero-gradient-2 {
        background: var(--accent);
        bottom: -30%;
        left: -20%;
        animation-delay: -10s;
      }

      @keyframes float {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(30px, -30px) scale(1.05); }
        66% { transform: translate(-20px, 20px) scale(0.95); }
      }

      .hero-content {
        max-width: 720px;
        position: relative;
      }

      .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: rgba(var(--primary-rgb), 0.08);
        color: var(--primary);
        padding: 8px 16px;
        border-radius: 100px;
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 28px;
        border: 1px solid rgba(var(--primary-rgb), 0.12);
        animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        opacity: 0;
      }

      .hero-badge::before {
        content: '';
        width: 6px;
        height: 6px;
        background: var(--primary);
        border-radius: 50%;
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.2); }
      }

      .hero h1 {
        font-size: clamp(40px, 6vw, 72px);
        font-weight: 600;
        line-height: 1.08;
        letter-spacing: -0.03em;
        margin-bottom: 24px;
        animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
        opacity: 0;
      }

      .hero p {
        font-size: clamp(17px, 2vw, 20px);
        color: var(--text-muted);
        max-width: 540px;
        line-height: 1.7;
        margin-bottom: 40px;
        animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
        opacity: 0;
      }

      .hero-buttons {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
        animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        opacity: 0;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(24px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .btn-primary {
        background: var(--primary);
        color: white;
        padding: 16px 32px;
        border-radius: 12px;
        text-decoration: none;
        font-size: 15px;
        font-weight: 500;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: inline-flex;
        align-items: center;
        gap: 10px;
        position: relative;
        overflow: hidden;
      }

      .btn-primary:hover {
        transform: translateY(-3px);
        box-shadow: 0 12px 32px rgba(var(--primary-rgb), 0.35);
      }

      .btn-primary svg {
        transition: transform 0.3s ease;
      }

      .btn-primary:hover svg {
        transform: translateX(4px);
      }

      .btn-secondary {
        color: var(--text);
        padding: 16px 32px;
        text-decoration: none;
        font-size: 15px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        border: 1px solid var(--border);
        border-radius: 12px;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        background: var(--bg-elevated);
      }

      .btn-secondary:hover {
        border-color: var(--primary);
        color: var(--primary);
        transform: translateY(-3px);
        box-shadow: var(--shadow-lg);
      }

      /* ===== SECTIONS ===== */
      section {
        padding: clamp(80px, 12vw, 140px) 0;
      }

      .section-header {
        margin-bottom: 64px;
      }

      .section-number {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: var(--primary);
        letter-spacing: 0.1em;
        margin-bottom: 12px;
        font-family: monospace;
      }

      .section-header h2 {
        font-size: clamp(32px, 4vw, 48px);
        font-weight: 600;
        letter-spacing: -0.02em;
        line-height: 1.15;
      }

      /* ===== SERVICES ===== */
      .services {
        background: var(--bg-alt);
        position: relative;
      }

      .services-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 24px;
      }

      .service {
        border-radius: 24px;
        transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        overflow: hidden;
        min-height: 280px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
      }

      /* Non-image cards */
      .service:not(.has-image) {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        padding: 36px;
        justify-content: flex-start;
      }

      .service:not(.has-image):hover {
        transform: translateY(-8px);
        box-shadow: var(--shadow-lg);
        border-color: var(--primary);
      }

      /* Image background cards */
      .service.has-image {
        background: var(--bg-elevated);
      }

      .service-bg {
        position: absolute;
        inset: 0;
        background-image: var(--bg-image);
        background-size: cover;
        background-position: center;
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .service-bg::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          to top,
          rgba(0, 0, 0, 0.85) 0%,
          rgba(0, 0, 0, 0.6) 40%,
          rgba(0, 0, 0, 0.3) 70%,
          rgba(0, 0, 0, 0.1) 100%
        );
        transition: background 0.4s ease;
      }

      .service.has-image:hover .service-bg {
        transform: scale(1.08);
      }

      .service.has-image:hover .service-bg::after {
        background: linear-gradient(
          to top,
          rgba(var(--primary-rgb), 0.9) 0%,
          rgba(var(--primary-rgb), 0.6) 40%,
          rgba(0, 0, 0, 0.2) 100%
        );
      }

      .service-content {
        position: relative;
        z-index: 2;
        padding: 32px;
      }

      .service.has-image .service-content {
        color: white;
      }

      .service-icon {
        width: 52px;
        height: 52px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .service:not(.has-image) .service-icon {
        background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.12), rgba(var(--primary-rgb), 0.04));
        backdrop-filter: none;
        border-color: rgba(var(--primary-rgb), 0.1);
      }

      .service-icon svg {
        width: 24px;
        height: 24px;
        stroke: var(--primary);
      }

      .service.has-image .service-icon svg {
        stroke: white;
      }

      .service:hover .service-icon {
        transform: scale(1.1);
        background: rgba(255, 255, 255, 0.25);
      }

      .service:not(.has-image):hover .service-icon {
        background: var(--primary);
      }

      .service:not(.has-image):hover .service-icon svg {
        stroke: white;
      }

      .service h3 {
        font-size: 22px;
        font-weight: 600;
        letter-spacing: -0.02em;
        margin-bottom: 8px;
        line-height: 1.2;
      }

      .service-desc {
        font-size: 14px;
        opacity: 0.8;
        line-height: 1.5;
        margin: 0;
      }

      .service:not(.has-image) .service-desc {
        color: var(--text-muted);
      }

      @media (max-width: 768px) {
        .services-grid {
          grid-template-columns: 1fr;
        }
        .service {
          min-height: 220px;
        }
      }

      /* ===== GALLERY ===== */
      .gallery {
        background: var(--bg);
      }

      .gallery-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }

      .gallery-item {
        border-radius: 20px;
        overflow: hidden;
        aspect-ratio: 4/3;
        position: relative;
        cursor: pointer;
      }

      .gallery-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .gallery-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(0,0,0,0.4), transparent);
        opacity: 0;
        transition: opacity 0.4s ease;
      }

      .gallery-item:hover img {
        transform: scale(1.08);
      }

      .gallery-item:hover .gallery-overlay {
        opacity: 1;
      }

      /* ===== ABOUT ===== */
      .about {
        background: var(--bg-alt);
      }

      .about-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 80px;
        align-items: center;
      }

      .about-text h2 {
        font-size: clamp(32px, 4vw, 48px);
        font-weight: 600;
        letter-spacing: -0.02em;
        margin-bottom: 24px;
        line-height: 1.15;
      }

      .about-text p {
        font-size: 17px;
        line-height: 1.8;
        color: var(--text-muted);
      }

      .about-image {
        border-radius: 24px;
        overflow: hidden;
        aspect-ratio: 4/3;
        position: relative;
      }

      .about-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .about-image:hover img {
        transform: scale(1.04);
      }

      /* ===== CONTACT ===== */
      .contact {
        background: var(--bg);
      }

      .contact-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
        margin-top: 48px;
      }

      .contact-card {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 24px 28px;
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 16px;
        text-decoration: none;
        color: inherit;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .contact-card:hover {
        border-color: var(--primary);
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }

      .contact-icon {
        width: 52px;
        height: 52px;
        background: rgba(var(--primary-rgb), 0.08);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--primary);
        flex-shrink: 0;
        transition: all 0.3s ease;
      }

      .contact-card:hover .contact-icon {
        background: var(--primary);
        color: white;
        transform: rotate(-5deg) scale(1.05);
      }

      .contact-info {
        flex: 1;
      }

      .contact-label {
        display: block;
        font-size: 12px;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 4px;
      }

      .contact-value {
        font-size: 16px;
        font-weight: 500;
      }

      .contact-arrow {
        color: var(--text-muted);
        opacity: 0;
        transform: translateX(-8px);
        transition: all 0.3s ease;
      }

      .contact-card:hover .contact-arrow {
        opacity: 1;
        transform: translateX(0);
        color: var(--primary);
      }

      /* ===== FOOTER ===== */
      footer {
        padding: 80px 0 40px;
        background: var(--secondary);
        color: white;
        position: relative;
        overflow: hidden;
      }

      footer::before {
        content: '';
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 1000px;
        height: 1000px;
        background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
        pointer-events: none;
      }

      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 48px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        margin-bottom: 32px;
        position: relative;
      }

      .footer-logo {
        height: 40px;
        opacity: 0.9;
        transition: opacity 0.2s ease;
      }

      .footer-logo:hover {
        opacity: 1;
      }

      .footer-nav {
        display: flex;
        gap: 40px;
        list-style: none;
      }

      .footer-nav a {
        color: rgba(255,255,255,0.6);
        text-decoration: none;
        font-size: 14px;
        transition: color 0.2s ease;
      }

      .footer-nav a:hover {
        color: white;
      }

      .footer-bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        color: rgba(255,255,255,0.4);
        position: relative;
      }

      .footer-bottom a {
        color: rgba(255,255,255,0.6);
        text-decoration: none;
        transition: color 0.2s ease;
      }

      .footer-bottom a:hover {
        color: white;
      }

      /* ===== COUNTDOWN BANNER ===== */
      .countdown-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--primary);
        color: white;
        padding: 16px 24px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        font-size: 14px;
        z-index: 1000;
        box-shadow: 0 -4px 24px rgba(0,0,0,0.15);
      }

      .countdown-timer {
        font-weight: 600;
        font-family: 'SF Mono', Monaco, monospace;
        font-size: 15px;
        background: rgba(255,255,255,0.15);
        padding: 6px 14px;
        border-radius: 8px;
        letter-spacing: 0.05em;
      }

      .countdown-btn {
        background: white;
        color: var(--primary);
        padding: 10px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 13px;
        transition: all 0.3s ease;
      }

      .countdown-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      }

      /* ===== REVEAL ANIMATION ===== */
      .reveal {
        opacity: 0;
        transform: translateY(32px);
        transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        transition-delay: var(--delay, 0s);
      }

      .reveal.visible {
        opacity: 1;
        transform: translateY(0);
      }

      /* ===== RESPONSIVE ===== */
      @media (max-width: 900px) {
        .about-content {
          grid-template-columns: 1fr;
          gap: 48px;
        }
        .gallery-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 768px) {
        .nav-links { display: none; }
        .hero { min-height: auto; padding: 140px 0 100px; }
        .hero h1 { font-size: 36px; }
        .footer-content { flex-direction: column; gap: 32px; text-align: center; }
        .footer-bottom { flex-direction: column; gap: 16px; text-align: center; }
        .countdown-banner { flex-wrap: wrap; padding: 14px 16px; gap: 12px; }
      }
    </style>
  </head>
  <body>
    <nav>
      <div class="container">
        <a href="#" class="logo">
          ${logoHtml}
        </a>
        <ul class="nav-links">
          ${hasServices ? '<li><a href="#services">Services</a></li>' : ''}
          ${hasGallery ? '<li><a href="#gallery">Gallery</a></li>' : ''}
          <li><a href="#about">About</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <div class="nav-right">
          ${themeToggleHtml}
          <a href="#contact" class="nav-cta">Get in Touch</a>
        </div>
      </div>
    </nav>

    <section class="hero">
      <div class="hero-bg">
        <div class="hero-gradient hero-gradient-1"></div>
        <div class="hero-gradient hero-gradient-2"></div>
      </div>
      <div class="container">
        <div class="hero-content">
          <div class="hero-badge">${businessType}</div>
          <h1>${tagline || business}</h1>
          <p>${description || aboutText || `Welcome to ${business}. We're dedicated to providing exceptional service and care.`}</p>
          <div class="hero-buttons">
            <a href="#contact" class="btn-primary">
              Get in Touch
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            ${hasServices ? '<a href="#services" class="btn-secondary">Explore Services</a>' : ''}
          </div>
        </div>
      </div>
    </section>

    ${hasServices ? `
    <section class="services" id="services">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-number">01</span>
          <h2>Our Services</h2>
        </div>
        <div class="services-grid">
          ${servicesHtml}
        </div>
      </div>
    </section>
    ` : ''}

    ${galleryHtml}

    <section class="about" id="about">
      <div class="container">
        <div class="about-content">
          <div class="about-text reveal">
            <span class="section-number">${hasGallery ? '04' : '02'}</span>
            <h2>About ${business}</h2>
            <p>${aboutText || description || `${business} is dedicated to providing exceptional service. Our experienced team is committed to meeting your needs and exceeding your expectations.`}</p>
          </div>
          ${galleryImages.length > 0 ? `
          <div class="about-image reveal" style="--delay: 0.15s">
            <img src="${galleryImages[0]}" alt="${business}" loading="lazy" />
          </div>
          ` : ''}
        </div>
      </div>
    </section>

    <section class="contact" id="contact">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-number">${hasGallery ? '05' : '03'}</span>
          <h2>Get in Touch</h2>
        </div>
        <div class="contact-grid">
          ${contactItems.join('')}
        </div>
      </div>
    </section>

    <footer>
      <div class="container">
        <div class="footer-content">
          ${logoBase64 ? `<img src="${logoBase64}" alt="${business}" class="footer-logo" />` : `<span style="font-weight: 600; font-size: 20px;">${business}</span>`}
          <ul class="footer-nav">
            ${hasServices ? '<li><a href="#services">Services</a></li>' : ''}
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>
        <div class="footer-bottom">
          <span>&copy; ${new Date().getFullYear()} ${business}</span>
          <span>Redesigned by <a href="https://garage.co.nz">Garage</a></span>
        </div>
      </div>
    </footer>

    <div class="countdown-banner">
      <span>This preview expires in</span>
      <span class="countdown-timer" id="countdown">48:00:00</span>
      <a href="#contact" class="countdown-btn">I Want This Site</a>
    </div>

    <script>
      // Theme toggle
      const toggle = document.querySelector('.theme-toggle');
      const html = document.documentElement;

      // Check saved preference or system preference
      const savedTheme = localStorage.getItem('theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        html.setAttribute('data-theme', 'dark');
      }

      if (toggle) {
        toggle.addEventListener('click', () => {
          const isDark = html.getAttribute('data-theme') === 'dark';
          html.setAttribute('data-theme', isDark ? 'light' : 'dark');
          localStorage.setItem('theme', isDark ? 'light' : 'dark');
        });
      }

      // Scroll effect for nav
      const nav = document.querySelector('nav');
      const handleScroll = () => nav.classList.toggle('scrolled', window.scrollY > 50);
      window.addEventListener('scroll', handleScroll, { passive: true });

      // Reveal animations on scroll
      const reveals = document.querySelectorAll('.reveal, .service');
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

      reveals.forEach(el => revealObserver.observe(el));

      // Countdown
      const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
      function updateCountdown() {
        const diff = deadline - new Date();
        if (diff <= 0) {
          document.getElementById('countdown').textContent = 'EXPIRED';
          return;
        }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        document.getElementById('countdown').textContent =
          h.toString().padStart(2, '0') + ':' +
          m.toString().padStart(2, '0') + ':' +
          s.toString().padStart(2, '0');
      }
      updateCountdown();
      setInterval(updateCountdown, 1000);
    </script>
  </body>
</html>
`;
}

// Convert hex to RGB values
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

function getServiceIcon(service: string, industry: string): string {
  const lower = service.toLowerCase();

  // SVG icons with consistent 24x24 viewBox, stroke-width 1.5
  const icons: Record<string, string> = {
    // Medical/Health
    maternity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"/><path d="M12 8v4m0 4h.01"/><circle cx="12" cy="10" r="2"/></svg>',
    aged: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6m-3-10h.01"/></svg>',
    palliative: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    respite: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>',
    surgery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M12 14h.01"/></svg>',
    rehab: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 2a5 5 0 0 0-5 5v7h2v-5l3 5h2l-3-5.5a5 5 0 0 0 3-4.5V10h-2z"/></svg>',
    dental: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C8 2 5 5 5 9c0 3 1 5 2 7 1 3 2 6 5 6s4-3 5-6c1-2 2-4 2-7 0-4-3-7-7-7z"/><path d="M9 9h6m-3-3v6"/></svg>',
    mental: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>',
    ortho: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v8m0 4v8M8 6l4 4 4-4M8 18l4-4 4 4"/></svg>',
    // Construction/Trades
    plumb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    electric: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
    build: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 20h20M4 20V8l8-6 8 6v12"/><path d="M9 20v-6h6v6m-3-14v4"/></svg>',
    roof: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"/><path d="M9 22V12h6v10"/></svg>',
    landscape: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3v18M5 12c0-4 3-7 7-7s7 3 7 7"/><path d="M5 12c0 2 1.5 4 3.5 5M19 12c0 2-1.5 4-3.5 5"/></svg>',
    // Professional
    legal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3v18M3 6l9 3 9-3M3 6v3c0 1 1.5 2 4.5 2.5M21 6v3c0 1-1.5 2-4.5 2.5"/><circle cx="12" cy="18" r="3"/></svg>',
    account: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3v18h18"/><path d="M7 16l4-6 4 4 5-8"/></svg>',
    // Lifestyle
    fitness: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 12H2v-2h4V7h2v10H6v-5zm16 0h-4v5h-2V7h2v3h4v2z"/><path d="M8 10h8v4H8z"/></svg>',
    salon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>',
    auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"/><path d="M3 11l2-6h14l2 6M3 11v6h18v-6M3 11h18"/></svg>',
    photo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
    tech: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg>',
    vet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5M14 5.172C14 3.782 15.577 2.679 17.5 3c2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.344-2.5"/><path d="M8 14v.5M16 14v.5M11.25 16.25h1.5L12 17l-.75-.75z"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309"/></svg>',
    // Food
    restaurant: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6h2v8h3"/></svg>',
    // Default
    default: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
  };

  // Match service name to icon
  if (lower.includes('maternity') || lower.includes('birth')) return icons.maternity;
  if (lower.includes('aged') || lower.includes('elder') || lower.includes('rest home')) return icons.aged;
  if (lower.includes('palliative') || lower.includes('end of life') || lower.includes('hospice')) return icons.palliative;
  if (lower.includes('respite') || lower.includes('short stay')) return icons.respite;
  if (lower.includes('surgery') || lower.includes('surgical') || lower.includes('theatre')) return icons.surgery;
  if (lower.includes('rehab') || lower.includes('physio') || lower.includes('exercise')) return icons.rehab;
  if (lower.includes('dental') || lower.includes('teeth')) return icons.dental;
  if (lower.includes('mental') || lower.includes('psych')) return icons.mental;
  if (lower.includes('ortho') || lower.includes('bone') || lower.includes('joint')) return icons.ortho;
  if (lower.includes('plumb') || lower.includes('pipe') || lower.includes('drain')) return icons.plumb;
  if (lower.includes('electric') || lower.includes('wiring') || lower.includes('power')) return icons.electric;
  if (lower.includes('build') || lower.includes('construct') || lower.includes('renovation')) return icons.build;
  if (lower.includes('roof')) return icons.roof;
  if (lower.includes('landscape') || lower.includes('garden') || lower.includes('lawn')) return icons.landscape;
  if (lower.includes('law') || lower.includes('legal') || lower.includes('attorney')) return icons.legal;
  if (lower.includes('tax') || lower.includes('account') || lower.includes('finance')) return icons.account;
  if (lower.includes('fit') || lower.includes('gym') || lower.includes('workout')) return icons.fitness;
  if (lower.includes('hair') || lower.includes('salon') || lower.includes('beauty')) return icons.salon;
  if (lower.includes('car') || lower.includes('auto') || lower.includes('vehicle')) return icons.auto;
  if (lower.includes('photo') || lower.includes('video') || lower.includes('film')) return icons.photo;
  if (lower.includes('tech') || lower.includes('software') || lower.includes('web') || lower.includes('app')) return icons.tech;
  if (lower.includes('vet') || lower.includes('pet') || lower.includes('animal')) return icons.vet;
  if (lower.includes('food') || lower.includes('dine') || lower.includes('cuisine') || lower.includes('menu')) return icons.restaurant;

  // Fallback by industry
  const industryMap: Record<string, string> = {
    medical: 'palliative', dental: 'dental', restaurant: 'restaurant', construction: 'build',
    plumbing: 'plumb', electrical: 'electric', landscaping: 'landscape', legal: 'legal',
    accounting: 'account', fitness: 'fitness', salon: 'salon', automotive: 'auto',
    photography: 'photo', tech: 'tech', veterinary: 'vet'
  };

  return icons[industryMap[industry]] || icons.default;
}

function getServiceDescription(service: string, industry: string): string {
  const lower = service.toLowerCase();

  // Industry-specific descriptions
  const descriptions: Record<string, Record<string, string>> = {
    medical: {
      maternity: 'Expert care for mothers and newborns',
      aged: 'Compassionate residential care services',
      palliative: 'Dignified end-of-life support',
      respite: 'Short-term relief and recovery care',
      surgery: 'Modern surgical facilities and expertise',
      ortho: 'Bone and joint specialist treatment',
      default: 'Professional healthcare services'
    },
    construction: {
      build: 'Quality construction from ground up',
      renovation: 'Transform your existing space',
      roof: 'Durable roofing solutions',
      default: 'Expert building services'
    },
    dental: {
      default: 'Complete dental care solutions'
    },
    legal: {
      default: 'Expert legal representation'
    },
    default: {
      default: 'Professional, reliable service'
    }
  };

  // Try to match service keywords
  const industryDescs = descriptions[industry] || descriptions.default;
  for (const [key, desc] of Object.entries(industryDescs)) {
    if (lower.includes(key)) return desc;
  }

  return industryDescs.default || 'Professional, reliable service';
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('02') && digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  if (digits.startsWith('0') && digits.length === 9) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }
  if (digits.startsWith('0800')) {
    return `0800 ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}
