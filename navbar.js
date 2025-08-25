// navbar.js
// Globally used navbar logic for the site

// Example: Highlight active nav button, handle dropdowns, etc.

document.addEventListener('DOMContentLoaded', function() {
  // Show nav-dot on active/current page
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    const pageName = btn.textContent.trim().toLowerCase().replace(/\s/g, '-');
    if (window.location.pathname.includes(pageName)) {
      const dot = btn.querySelector('.nav-dot');
      if (dot) dot.style.display = 'inline-block';
    } else {
      const dot = btn.querySelector('.nav-dot');
      if (dot) dot.style.display = 'none';
    }
  });

  // Dropdown for 'Work' button
  const workBtn = document.getElementById('navWorkBtn');
  const workDropdown = document.getElementById('navWorkDropdown');
  if (workBtn && workDropdown) {
    workBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      workDropdown.classList.toggle('open');
    });
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!workBtn.contains(e.target) && !workDropdown.contains(e.target)) {
        workDropdown.classList.remove('open');
      }
    });
  }
});
   // Hamburger menu for mobile
   const navbarHamburger = document.getElementById('navbarHamburger');
   const navbarMobileMenu = document.getElementById('navbarMobileMenu');
 
   if (navbarHamburger && navbarMobileMenu) {
     navbarHamburger.addEventListener('click', function(e) {
       navbarMobileMenu.classList.toggle('open');
     });
     document.addEventListener('click', function(e) {
       if (!navbarMobileMenu.contains(e.target) && !navbarHamburger.contains(e.target)) {
         navbarMobileMenu.classList.remove('open');
       }
     });
   }
