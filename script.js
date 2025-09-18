document.getElementById('book-call-1').addEventListener('click', function (e) {
    // If other scripts call preventDefault, this ignores them:
    window.location.assign('https://cal.com/lumas-studio/fullstack');
  });