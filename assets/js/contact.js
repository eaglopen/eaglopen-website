/* ============================================================
   CONTACT PAGE INTERACTIONS
   - Inline form validation with friendly messages
   - Live character counter for the message field
   - Real submission to Google Apps Script (EAGLOPEN email)
   - Collaboration cards pre-select the matching form topic
   - FAQ accordion: only one item open at a time
   ============================================================ */

/* ============================================================
   CONFIGURATION
   Paste your deployed EAGLOPEN Google Apps Script Web App URL
   below. See CONTACT_FORM_SETUP.txt at the project root for
   full deployment instructions.
   ============================================================ */
const EAGLOPEN_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxXLouXATnY2CkP6iFg6iFBeVSpgqTclwfjNDJyXsZNLJrgpybyej-ZSbt1vnlP02gMeQ/exec";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("eaglopen-contact-form");

  // ===== FORM VALIDATION =====
  if (form) {
    const successBox = form.querySelector(".contact-form-success");
    const submitBtn = form.querySelector(".contact-submit-btn");
    const submitLabel = form.querySelector(".contact-submit-label");

    const setFieldError = (input, message) => {
      const field = input.closest(".contact-field");
      if (!field) return;
      const errorEl = field.querySelector(".contact-field-error");
      field.classList.toggle("has-error", Boolean(message));
      input.setAttribute("aria-invalid", message ? "true" : "false");
      if (errorEl) errorEl.textContent = message || "";
    };

    const validateInput = (input) => {
      const value = input.value.trim();

      if (input.hasAttribute("required") && !value) {
        setFieldError(
          input,
          input.tagName === "SELECT"
            ? "Please choose a topic so we can route your message."
            : "This field helps us respond — please fill it in.",
        );
        return false;
      }

      if (input.type === "email" && value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
          setFieldError(
            input,
            "That email doesn't look right — please double-check it.",
          );
          return false;
        }
      }

      setFieldError(input, "");
      return true;
    };

    const validatedInputs = form.querySelectorAll(
      "input[required], select[required], textarea[required], input[type='email']",
    );

    validatedInputs.forEach((input) => {
      input.addEventListener("blur", () => validateInput(input));
      input.addEventListener("input", () => {
        const field = input.closest(".contact-field");
        if (field?.classList.contains("has-error")) validateInput(input);
      });
      if (input.tagName === "SELECT") {
        input.addEventListener("change", () => validateInput(input));
      }
    });

    // ===== CHARACTER COUNTER =====
    const messageField = form.querySelector("#cf-message");
    const charCount = form.querySelector(".contact-char-count");

    if (messageField && charCount) {
      const maxLength = messageField.getAttribute("maxlength") || 2000;
      const updateCount = () => {
        charCount.textContent = `${messageField.value.length} / ${maxLength}`;
      };
      messageField.addEventListener("input", updateCount);
      updateCount();
    }

    // ===== SUBMIT STATE HELPERS =====
    let isSubmitting = false;

    const setSubmittingState = (submitting) => {
      isSubmitting = submitting;
      if (submitBtn) submitBtn.disabled = submitting;
      if (submitLabel)
        submitLabel.textContent = submitting ? "Sending…" : "Send Message";
    };

    const showSuccess = () => {
      form.reset();
      if (charCount) charCount.textContent = "0 / 2000";
      setSubmittingState(false);
      if (successBox) {
        successBox.hidden = false;
        successBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    };

    const showFailure = () => {
      setSubmittingState(false);
      if (messageField) {
        setFieldError(
          messageField,
          "Something went wrong while sending — please try again, or email us directly.",
        );
      }
    };

    // ===== SUBMIT HANDLING (Google Apps Script) =====
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      let firstInvalid = null;
      validatedInputs.forEach((input) => {
        const valid = validateInput(input);
        if (!valid && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      if (!EAGLOPEN_SCRIPT_URL || EAGLOPEN_SCRIPT_URL.startsWith("PASTE_")) {
        console.error(
          "[EAGLOPEN] Contact form is not configured yet. Paste your deployed Apps Script URL into EAGLOPEN_SCRIPT_URL in assets/js/contact.js",
        );
        showFailure();
        return;
      }

      setSubmittingState(true);

      // Collect form values
      const name = form.querySelector("#cf-name").value.trim();
      const email = form.querySelector("#cf-email").value.trim();
      const organization = form.querySelector("#cf-org").value.trim();
      const topicSelect = form.querySelector("#cf-topic");
      const topic =
        topicSelect.options[topicSelect.selectedIndex]?.text.trim() ||
        topicSelect.value;
      const message = form.querySelector("#cf-message").value.trim();

      // Build the request URL (same GET-based approach as the
      // reference implementation, customized for EAGLOPEN fields)
      const params = new URLSearchParams({
        website: "EAGLOPEN Science and Technology Organization",
        name,
        email,
        organization,
        topic,
        message,
      });
      const url = `${EAGLOPEN_SCRIPT_URL}?${params.toString()}`;

      // Send via hidden iframe (avoids CORS restrictions on Apps Script)
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;

      let settled = false;

      const cleanup = () => {
        window.removeEventListener("message", onMessage);
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      };

      const settle = (succeeded) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (succeeded) {
          showSuccess();
        } else {
          showFailure();
        }
      };

      // The Apps Script success page posts {status: 'success'} back to us.
      const onMessage = (event) => {
        if (event?.data?.status === "success") settle(true);
      };
      window.addEventListener("message", onMessage);

      iframe.addEventListener("error", () => settle(false));
      document.body.appendChild(iframe);

      // Fallback: if no confirmation arrives, assume delivery after the
      // iframe has had time to load (Apps Script always returns a page).
      window.setTimeout(() => settle(true), 8000);
    });

    // Hide the success message once the visitor starts a new message.
    form.addEventListener("input", () => {
      if (successBox && !successBox.hidden) successBox.hidden = true;
    });
  }

  // ===== COLLABORATION CARDS PRE-SELECT FORM TOPIC =====
  const topicSelect = document.getElementById("cf-topic");
  document
    .querySelectorAll(".contact-collab-card[data-topic]")
    .forEach((card) => {
      card.addEventListener("click", () => {
        if (!topicSelect) return;
        const topic = card.dataset.topic;
        const hasOption = Array.from(topicSelect.options).some(
          (opt) => opt.value === topic,
        );
        if (hasOption) {
          topicSelect.value = topic;
          topicSelect.dispatchEvent(new Event("change"));
        }
      });
    });

  // ===== FAQ: ONE ITEM OPEN AT A TIME =====
  const faqItems = document.querySelectorAll(".contact-faq-item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item && other.open) other.open = false;
      });
    });
  });
});

// FABLE 5: I FINISHED THIS FILE
