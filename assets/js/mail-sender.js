// Simple email sender module with EmailJS support and mailto fallback
// Usage: MailSender.sendEmail(data) where data contains form fields
(function() {

  const WORKER_URL = 'https://solitary-morning-4035.antmabiala.workers.dev/';
  const CONFIG_URL = WORKER_URL + 'config';
  const EMAIL_TO = 'info@sharehopes.org';
  let EMAILJS_PUBLIC_KEY = '';
  let EMAILJS_SERVICE_ID = '';
  let EMAILJS_TEMPLATE_ID = '';
  let emailJsReady = false;
  let workerFailed = false;

  async function submitToWorker(data) {
    if (workerFailed) {
      throw new Error('Worker previously failed');
    }
    
    try {
      const message = buildMessage(data);
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          email: data.email || '',
          message: message
        })
      });

      console.log('Worker response status:', res.status);

      const bodyText = await res.text();
      console.log('Worker response bodyText:', bodyText);
      
      if (!res.ok) {
        console.error('Worker error response:', res.status, bodyText);
        throw new Error(`Worker error: ${res.status} ${bodyText}`);
      }
      
      return bodyText;
    } catch (e) {
      console.warn('Cloudflare Worker submission failed:', e.message);
      workerFailed = true;
      throw e;
    }
  }

  async function loadEmailJsConfig() {
    try {
      const res = await fetch(CONFIG_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'emailjs-config' })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const cfg = await res.json().catch(() => ({ publicKey: '', serviceId: '', templateId: '' }));
      EMAILJS_PUBLIC_KEY = cfg.publicKey || window.EMAILJS_PUBLIC_KEY || '';
      EMAILJS_SERVICE_ID = cfg.serviceId || window.EMAILJS_SERVICE_ID || '';
      EMAILJS_TEMPLATE_ID = cfg.templateId || window.EMAILJS_TEMPLATE_ID || '';
      return cfg;
    } catch (e) {
      EMAILJS_PUBLIC_KEY = window.EMAILJS_PUBLIC_KEY || '';
      EMAILJS_SERVICE_ID = window.EMAILJS_SERVICE_ID || '';
      EMAILJS_TEMPLATE_ID = window.EMAILJS_TEMPLATE_ID || '';
      return { publicKey: EMAILJS_PUBLIC_KEY, serviceId: EMAILJS_SERVICE_ID, templateId: EMAILJS_TEMPLATE_ID };
    }
  }

  async function ensureEmailJsReady() {
    if (emailJsReady) return true;
    await loadEmailJsConfig();
    const hasEmailJS = typeof window.emailjs !== 'undefined';
    if (hasEmailJS && EMAILJS_PUBLIC_KEY) {
      try { window.emailjs.init(EMAILJS_PUBLIC_KEY); emailJsReady = true; } catch (e) {}
    }
    return emailJsReady;
  }

  function getSelectText(selectEl) {
    if (!selectEl) return '';
    const idx = selectEl.selectedIndex;
    if (idx >= 0 && selectEl.options[idx]) return selectEl.options[idx].text;
    return '';
  }

  function composeDataFromForm(form) {
    if (!form) return {};
    const byId = (id) => document.getElementById(id);
    const firstName = (byId('firstName')?.value || '').trim();
    const lastName = (byId('lastName')?.value || '').trim();
    const email = (byId('email')?.value || '').trim();
    const phone = (byId('phone')?.value || '').trim();
    const address = (byId('address')?.value || '').trim();
    const postcode = (byId('postcode')?.value || '').trim();

    const countryEl = byId('country');
    const cityEl = byId('city');
    const country = countryEl ? countryEl.value : '';
    const city = cityEl ? cityEl.value : '';
    const countryLabel = getSelectText(countryEl);
    const cityLabel = getSelectText(cityEl);

    // Volunteer interests (labels preferred if present)
    const volunteerChecked = Array.from(document.querySelectorAll('input[name="volunteerType"]:checked'));
    const volunteerInterests = volunteerChecked.map(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      return (label ? label.textContent : input.value).trim();
    });

    const availabilityEl = byId('availability');
    const availability = availabilityEl ? availabilityEl.value : '';
    const availabilityLabel = getSelectText(availabilityEl);

    const skills = (byId('skills')?.value || '').trim();

    return {
      firstName, lastName, email, phone, address, postcode,
      country, countryLabel, city, cityLabel,
      volunteerInterests: volunteerInterests.join(', '),
      availability, availabilityLabel,
      skills
    };
  }

  function buildMessage(data) {
    const lines = [
      `New involvement submission`,
      ``,
      `Name: ${data.firstName || ''} ${data.lastName || ''}`.trim(),
      `Email: ${data.email || ''}`,
      `Phone: ${data.phone || ''}`,
      `Address: ${data.address || ''}`,
      `City: ${data.cityLabel || data.city || ''}`,
      `Postcode: ${data.postcode || ''}`,
      `Country: ${data.countryLabel || data.country || ''}`,
      `Volunteer interests: ${data.volunteerInterests || '—'}`,
      `Availability: ${data.availabilityLabel || data.availability || '—'}`,
      `Skills: ${data.skills || '—'}`,
      ``,
      `Donation amount: ${data.donationAmount || '—'}`
    ];
    return lines.join('\n');
  }

  async function sendEmail(data) {
    const subject = `New Involvement: ${data.firstName || ''} ${data.lastName || ''}`.trim();
    const message = buildMessage(data);

    try {
      const ready = await ensureEmailJsReady();
      if (ready && EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID) {
        await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_email: EMAIL_TO,
          subject,
          message,
          ...data
        });
        return { success: true, method: 'emailjs' };
      }
    } catch (e) {
      console.warn('EmailJS send failed:', e.message);
    }

    try {
      await submitToWorker({ ...data });
      return { success: true, method: 'worker' };
    } catch (e) {
      console.warn('Worker submission failed, falling back to mailto:', e.message);
    }

    const mailto = `mailto:${EMAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    try {
      window.location.href = mailto;
    } catch (fallbackError) {
      console.warn('mailto fallback also failed:', fallbackError.message);
      throw new Error('All submission methods failed');
    }
    return { fallback: 'mailto' };
  }

  window.MailSender = {
    composeDataFromForm,
    sendEmail
  };
})();