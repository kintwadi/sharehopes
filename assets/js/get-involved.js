 
        // Wait for DOM and external scripts to load
        document.addEventListener('DOMContentLoaded', function() {
            if (window.CountryPhoneCode && typeof window.CountryPhoneCode.init === 'function') {
                window.CountryPhoneCode.init();
            }
            // Tab switching functionality
            const tabs = document.querySelectorAll('.tab');
            const tabContents = document.querySelectorAll('.tab-content');
            const progressSteps = document.querySelectorAll('.progress-step');
            
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabId = this.getAttribute('data-tab');
                    
                    // Update tabs
                    tabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Update tab contents
                    tabContents.forEach(content => content.classList.remove('active'));
                    document.getElementById(`${tabId}-tab`).classList.add('active');
                    
                    // Update progress bar
                    const step = this.getAttribute('data-tab');
                    updateProgressBar(step);
                });
            });
            
            // Next button functionality
            const nextButtons = document.querySelectorAll('.next-tab');
            nextButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const nextTab = this.getAttribute('data-next');
                    
                    // Update tabs
                    tabs.forEach(t => t.classList.remove('active'));
                    document.querySelector(`.tab[data-tab="${nextTab}"]`).classList.add('active');
                    
                    // Update tab contents
                    tabContents.forEach(content => content.classList.remove('active'));
                    document.getElementById(`${nextTab}-tab`).classList.add('active');
                    
                    // Update progress bar
                    updateProgressBar(nextTab);
                });
            });
            
            // Previous button functionality
            const prevButtons = document.querySelectorAll('.prev-tab');
            prevButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const prevTab = this.getAttribute('data-prev');
                    
                    // Update tabs
                    tabs.forEach(t => t.classList.remove('active'));
                    document.querySelector(`.tab[data-tab="${prevTab}"]`).classList.add('active');
                    
                    // Update tab contents
                    tabContents.forEach(content => content.classList.remove('active'));
                    document.getElementById(`${prevTab}-tab`).classList.add('active');
                    
                    // Update progress bar
                    updateProgressBar(prevTab);
                });
            });
            
            // Update progress bar based on active tab
            function updateProgressBar(activeTab) {
                progressSteps.forEach(step => step.classList.remove('active'));
                if (activeTab === 'donation') {
                    document.querySelector('.progress-step[data-step="1"]').classList.add('active');
                } else if (activeTab === 'volunteer') {
                    document.querySelector('.progress-step[data-step="2"]').classList.add('active');
                }
            }
            
            // Handle donation amount buttons
            const amountButtons = document.querySelectorAll('.amount-btn');
            const customAmountInput = document.getElementById('customAmount');
            
            amountButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Remove selected class from all buttons
                    amountButtons.forEach(btn => btn.classList.remove('selected'));
                    
                    // Add selected class to clicked button
                    this.classList.add('selected');
                    
                    // Clear custom amount input
                    customAmountInput.value = '';
                });
            });
            
            // Clear selected buttons when custom amount is entered
            if (customAmountInput) {
                customAmountInput.addEventListener('input', function() {
                    amountButtons.forEach(btn => btn.classList.remove('selected'));
                });
            }
            
            // Form submission
            const form = document.getElementById('involvement-form');
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Basic validation
                const firstName = document.getElementById('firstName').value;
                const lastName = document.getElementById('lastName').value;
                const email = document.getElementById('email').value;
                
                if (!firstName || !lastName || !email) {
                    alert('Please fill in all required fields (marked with *)');
                    // Switch to volunteer tab
                    tabs.forEach(t => t.classList.remove('active'));
                    document.querySelector('.tab[data-tab="volunteer"]').classList.add('active');
                    tabContents.forEach(content => content.classList.remove('active'));
                    document.getElementById('volunteer-tab').classList.add('active');
                    updateProgressBar('volunteer');
                    return;
                }
                
                // Check if donation amount is selected
                const selectedAmount = document.querySelector('.amount-btn.selected');
                const customAmount = customAmountInput ? customAmountInput.value : '';
                const requireDonationAmount = (amountButtons && amountButtons.length > 0) || !!customAmountInput;
                if (requireDonationAmount && !selectedAmount && !customAmount) {
                    alert('Please select or enter a donation amount');
                    // Switch to donation tab
                    tabs.forEach(t => t.classList.remove('active'));
                    document.querySelector('.tab[data-tab="donation"]').classList.add('active');
                    tabContents.forEach(content => content.classList.remove('active'));
                    document.getElementById('donation-tab').classList.add('active');
                    updateProgressBar('donation');
                    return;
                }
                
                // Compose form data and send email
                if (window.CountryPhoneCode && typeof window.CountryPhoneCode.onBeforeSubmit === 'function') {
                    window.CountryPhoneCode.onBeforeSubmit();
                }
                const payload = window.MailSender ? window.MailSender.composeDataFromForm(form) : {};
                payload.donationAmount = customAmount || (selectedAmount ? (selectedAmount.getAttribute('data-amount') || selectedAmount.textContent) : '');

                const showSuccessModal = () => {
                    const overlay = document.getElementById('success-modal');
                    if (!overlay) return;
                    overlay.classList.add('show');
                    overlay.setAttribute('aria-hidden', 'false');
                };

                const hideSuccessModal = () => {
                    const overlay = document.getElementById('success-modal');
                    if (!overlay) return;
                    overlay.classList.remove('show');
                    overlay.setAttribute('aria-hidden', 'true');
                };

                // Close handlers
                const modalCloseBtn = document.getElementById('modal-close-btn');
                if (modalCloseBtn) {
                    modalCloseBtn.addEventListener('click', hideSuccessModal);
                }
                const modalOverlay = document.getElementById('success-modal');
                if (modalOverlay) {
                    modalOverlay.addEventListener('click', (e) => {
                        if (e.target === modalOverlay) hideSuccessModal();
                    });
                }

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') hideSuccessModal();
                });

                const afterSuccess = () => {
                    hideSendingModal();
                    showSuccessModal();
                    form.reset();
                    amountButtons.forEach(btn => btn.classList.remove('selected'));
                    // Reset to volunteer tab
                    tabs.forEach(t => t.classList.remove('active'));
                    document.querySelector('.tab[data-tab="volunteer"]').classList.add('active');
                    tabContents.forEach(content => content.classList.remove('active'));
                    document.getElementById('volunteer-tab').classList.add('active');
                    updateProgressBar('volunteer');
                };

                const onError = (err) => {
                    console.error('Failed to send involvement email', err);
                    hideSendingModal();
                    alert('We could not send your email automatically. Please try again or email us at info@sharehopes.org.');
                };

                const showSendingModal = () => {
                    const overlay = document.getElementById('sending-modal');
                    if (!overlay) return;
                    overlay.classList.add('show');
                    overlay.setAttribute('aria-hidden', 'false');
                };

                const hideSendingModal = () => {
                    const overlay = document.getElementById('sending-modal');
                    if (!overlay) return;
                    overlay.classList.remove('show');
                    overlay.setAttribute('aria-hidden', 'true');
                };

                if (window.MailSender && typeof window.MailSender.sendEmail === 'function') {
                    showSendingModal();
                    window.MailSender.sendEmail(payload).then(afterSuccess).catch(onError);
                } else {
                    // As a fallback, proceed with success flow
                    afterSuccess();
                }
            });
            
            // Language dropdown initialization is handled globally in script.js
        });
    