document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // 1. Navbar Scroll Effect & Mobile Menu Toggle
  // ==========================================
  const navbar = document.getElementById('navbar');
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    // Rotate toggle lines
    menuToggle.classList.toggle('active');
  });

  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      menuToggle.classList.remove('active');
    });
  });

  // ==========================================
  // 2. Products Slider / Carousel (Card Switching)
  // ==========================================
  const sliderTrack = document.getElementById('sliderTrack');
  const prevSlide = document.getElementById('prevSlide');
  const nextSlide = document.getElementById('nextSlide');
  const sliderDots = document.querySelectorAll('.slider-dot');
  const productCards = document.querySelectorAll('.product-card');
  
  let currentSlide = 0;
  const totalSlides = productCards.length;

  function updateSlider() {
    // Only apply slide translation if viewport width is less than or equal to 992px
    if (window.innerWidth <= 992) {
      sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    } else {
      sliderTrack.style.transform = 'none';
    }
    
    // Update dots
    sliderDots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentSlide);
    });
  }

  nextSlide.addEventListener('click', () => {
    if (currentSlide < totalSlides - 1) {
      currentSlide++;
    } else {
      currentSlide = 0; // wrap around
    }
    updateSlider();
  });

  prevSlide.addEventListener('click', () => {
    if (currentSlide > 0) {
      currentSlide--;
    } else {
      currentSlide = totalSlides - 1; // wrap around
    }
    updateSlider();
  });

  sliderDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      currentSlide = index;
      updateSlider();
    });
  });

  // Re-evaluate on window resize
  window.addEventListener('resize', updateSlider);

  // ==========================================
  // 3. FAQ Accordion Animation & Toggles
  // ==========================================
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close other items
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
      });

      // Toggle current item
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // ==========================================
  // 4. Pricing Package Price Selector
  // ==========================================
  const packageSelect = document.getElementById('packageSelect');
  const priceAmount = document.getElementById('priceAmount');

  if (packageSelect && priceAmount) {
    packageSelect.addEventListener('change', (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const newPrice = selectedOption.getAttribute('data-price');
      if (newPrice) {
        priceAmount.textContent = newPrice;
      }
    });
  }

  // ==========================================
  // 5. Scroll Reveal Intersection Observer
  // ==========================================
  const revealElements = document.querySelectorAll('.reveal-element');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target); // trigger animation only once
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(element => {
    revealObserver.observe(element);
  });

  // ==========================================
  // 6. Interactive Form Handling (Lead & Pricing)
  // ==========================================
  const freebieForm = document.getElementById('freebieForm');
  const buyNowBtn = document.getElementById('buyNowBtn');

  if (freebieForm) {
    freebieForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('freebieEmail').value;
      const name = document.getElementById('freebieName').value;
      
      // Feedback to user
      const submitBtn = document.getElementById('freebieSubmitBtn');
      submitBtn.textContent = 'Preparing Guide...';
      submitBtn.disabled = true;
      
      setTimeout(() => {
        alert(`Thank you, ${name}! Your free guide has been sent to ${email}.`);
        freebieForm.reset();
        submitBtn.textContent = 'Send Guide to My Inbox';
        submitBtn.disabled = false;
      }, 1200);
    });
  }

  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      const accommodation = packageSelect.options[packageSelect.selectedIndex].text.split(' — ')[0];
      const dateVal = document.getElementById('bookingDates').value;
      
      if (!dateVal) {
        alert('Please choose a check-in date before reserving.');
        return;
      }

      alert(`Redirecting you to checkout for: ${accommodation} starting on ${dateVal}.`);
    });
  }

  // ==========================================
  // 7. Room Booking Calculator
  // ==========================================
  const bookingForm = document.querySelector('.widget-booking-form');
  if (bookingForm) {
    const checkinInput = bookingForm.querySelector('[name="checkin"]');
    const checkoutInput = bookingForm.querySelector('[name="checkout"]');
    const mealplanSelect = bookingForm.querySelector('[name="mealplan"]');
    const mattressCheckbox = bookingForm.querySelector('[name="extramattress"]');

    const calcNights = bookingForm.querySelector('.calc-nights');
    const calcPlanPrice = bookingForm.querySelector('.calc-plan-price');
    const calcMattressRow = bookingForm.querySelector('.calc-mattress-row');
    const calcMattressPrice = bookingForm.querySelector('.calc-mattress-price');
    const calcTotal = bookingForm.querySelector('.calc-total');

    function formatCurrency(amount) {
      return '₹' + amount.toLocaleString('en-IN');
    }

    function calculateTotal() {
      if (!checkinInput || !checkoutInput) return;
      
      const checkinDate = new Date(checkinInput.value);
      const checkoutDate = new Date(checkoutInput.value);

      let nights = 1;
      if (checkinInput.value && checkoutInput.value) {
        const timeDiff = checkoutDate.getTime() - checkinDate.getTime();
        nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
        if (nights <= 0) nights = 1;
      }

      const mealPlan = mealplanSelect ? mealplanSelect.value : 'cp';
      const isMattress = mattressCheckbox ? mattressCheckbox.checked : false;

      const basePrice = parseInt(bookingForm.getAttribute(`data-base-${mealPlan}`)) || 0;
      const mattressPrice = isMattress ? (parseInt(bookingForm.getAttribute(`data-extra-${mealPlan}`)) || 0) : 0;

      if (calcNights) calcNights.textContent = `${nights} ${nights === 1 ? 'night' : 'nights'}`;
      if (calcPlanPrice) calcPlanPrice.textContent = formatCurrency(basePrice);

      if (calcMattressRow) {
        if (isMattress && mattressPrice > 0) {
          calcMattressRow.style.display = 'flex';
          if (calcMattressPrice) calcMattressPrice.textContent = formatCurrency(mattressPrice);
        } else {
          calcMattressRow.style.display = 'none';
        }
      }

      const total = (basePrice + mattressPrice) * nights;
      if (calcTotal) calcTotal.textContent = formatCurrency(total);
    }

    if (checkinInput) checkinInput.addEventListener('change', calculateTotal);
    if (checkoutInput) checkoutInput.addEventListener('change', calculateTotal);
    if (mealplanSelect) mealplanSelect.addEventListener('change', calculateTotal);
    if (mattressCheckbox) mattressCheckbox.addEventListener('change', calculateTotal);

    // Initial check-in/check-out date defaults (tomorrow & day after tomorrow)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    if (checkinInput && !checkinInput.value) {
      checkinInput.value = tomorrow.toISOString().split('T')[0];
    }
    if (checkoutInput && !checkoutInput.value) {
      checkoutInput.value = dayAfter.toISOString().split('T')[0];
    }

    calculateTotal();
  }
});
