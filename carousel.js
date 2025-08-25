// Carousel slider with horizontal movement
const track = document.querySelector('.carousel-track');
const slides = Array.from(document.querySelectorAll('.carousel-slide'));
const leftArrow = document.querySelector('.carousel-arrow-left');
const rightArrow = document.querySelector('.carousel-arrow-right');
let currentIndex = 0;

function updateCarousel() {
  const slideWidth = slides[0].offsetWidth + parseInt(getComputedStyle(track).gap || 24);
  track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === currentIndex);
  });
}

leftArrow.addEventListener('click', () => {
  currentIndex = Math.max(0, currentIndex - 1);
  updateCarousel();
});

rightArrow.addEventListener('click', () => {
  currentIndex = Math.min(slides.length - 1, currentIndex + 1);
  updateCarousel();
});

window.addEventListener('resize', updateCarousel);

// Initialize
updateCarousel();
