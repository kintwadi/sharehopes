// Simple email sender module with EmailJS support and mailto fallback
// Usage: MailSender.sendEmail(data) where data contains form fields
(function() {

  window.EMAILJS_PUBLIC_KEY = 'FoAXjwHBBNLH0xjR6';
  window.EMAILJS_SERVICE_ID = 'service_3y7lnma';
  window.EMAILJS_TEMPLATE_ID = 'template_pqpy4yg';
  const EMAIL_TO = 'info@sharehopes.org';

  // Optional EmailJS configuration via global variables
  const EMAILJS_PUBLIC_KEY = window.EMAILJS_PUBLIC_KEY || '';
  const EMAILJS_SERVICE_ID = window.EMAILJS_SERVICE_ID || '';
  const EMAILJS_TEMPLATE_ID = window.EMAILJS_TEMPLATE_ID || '';

  const hasEmailJS = typeof window.emailjs !== 'undefined';
 
  const emailJsConfigured = hasEmailJS && EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID;

  if (emailJsConfigured) {
    try { window.emailjs.init(EMAILJS_PUBLIC_KEY); } catch (e) { console.warn('EmailJS init failed', e); }
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

  function sendEmail(data) {
    const subject = `New Involvement: ${data.firstName || ''} ${data.lastName || ''}`.trim();
    const message = buildMessage(data);

    if (emailJsConfigured) {
      return window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: EMAIL_TO,
        subject,
        message,
        // pass fields to template if desired
        ...data
      });
    } else {
      // Fallback: open mail client with prefilled email
      const mailto = `mailto:${EMAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      try {
        window.location.href = mailto;
      } catch (e) {
        console.warn('mailto fallback failed', e);
      }
      // Resolve immediately so UI proceeds
      return Promise.resolve({ fallback: 'mailto' });
    }
  }

  window.MailSender = {
    composeDataFromForm,
    sendEmail
  };
})();