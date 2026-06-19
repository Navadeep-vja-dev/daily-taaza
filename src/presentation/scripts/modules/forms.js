/**
 * Presentation layer — Form handlers
 */
const Forms = {
  initNewsletter() {
    const form = document.querySelector('.newsletter-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const success = form.parentElement.querySelector('.newsletter-success');
      const email = input ? input.value.trim() : '';
      const validation = ContactService.validateNewsletter(email);

      if (!validation.valid) {
        input.classList.add('input--error');
        return;
      }

      try {
        const res = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || 'Subscribe failed');
        input.classList.remove('input--error');
        if (success) {
          success.hidden = false;
          success.textContent = 'Welcome to the Daily Taaza family! Check your inbox soon.';
        }
        input.value = '';
      } catch (err) {
        input.classList.add('input--error');
      }
    });
  },

  initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = form.querySelector('#name');
      const email = form.querySelector('#email');
      const message = form.querySelector('#message');
      const success = document.getElementById('contact-success');

      [name, email, message].forEach((field) => field.classList.remove('input--error'));

      const validation = ContactService.validateContact({
        name: name.value,
        email: email.value,
        message: message.value,
      });

      if (!validation.valid) {
        validation.errors.forEach((fieldName) => {
          const field = form.querySelector('#' + fieldName);
          if (field) field.classList.add('input--error');
        });
        return;
      }

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.value.trim(),
            email: email.value.trim(),
            message: message.value.trim(),
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || 'Submit failed');
        if (success) {
          success.hidden = false;
          success.textContent = "Thank you! We'll get back to you within 24 hours.";
        }
        form.reset();
      } catch (err) {
        if (success) {
          success.hidden = false;
          success.textContent = 'Something went wrong. Please try again.';
          success.style.color = 'var(--color-error)';
        }
      }
    });
  },

  init() {
    this.initNewsletter();
    this.initContactForm();
  },
};
