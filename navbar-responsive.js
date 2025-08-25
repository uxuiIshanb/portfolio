// Responsive Navbar with GSAP Animations
// Requires GSAP (already loaded in your HTML)

document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.getElementById('navbarHamburger');
  const mobileMenu = document.getElementById('navbarMobileMenu');
  const menuItems = document.querySelectorAll('.nav-mobile-item');
  let menuOpen = false;

  // GSAP timeline for menu open/close
  const tl = gsap.timeline({ paused: true });
  tl.to(mobileMenu, { x: 0, duration: 0.45, ease: 'power2.out' })
    .to(menuItems, {
      opacity: 1,
      y: 0,
      stagger: 0.12,
      duration: 0.35,
      ease: 'power2.out',
    }, '-=0.25');

  // Initially position menu off-screen
  gsap.set(mobileMenu, { x: '100%' });
  gsap.set(menuItems, { opacity: 0, y: 40 });

  function openMenu() {
    mobileMenu.style.display = 'block';
    tl.play();
    menuOpen = true;
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    tl.reverse();
    menuOpen = false;
    document.body.style.overflow = '';
    setTimeout(() => {
      if (!menuOpen) mobileMenu.style.display = 'none';
    }, 500);
  }

  hamburger.addEventListener('click', function (e) {
    e.stopPropagation();
    if (!menuOpen) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', function (e) {
    if (menuOpen && !mobileMenu.contains(e.target) && e.target !== hamburger) {
      closeMenu();
    }
  });

  // Prevent click inside menu from closing
  mobileMenu.addEventListener('click', function (e) {
    e.stopPropagation();
  });

  // Close menu on resize above 1280px
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1280 && menuOpen) {
      closeMenu();
    }
  });
});
