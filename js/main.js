// js/main.js (renderer main file)
document.addEventListener("DOMContentLoaded", function() {
  // Load HTML partials dynamically
  Promise.all([
    fetch('partials/header.html').then(response => {
      if (!response.ok) {
        throw new Error('Header partial not found');
      }
      return response.text();
    }),
    fetch('partials/chart.html').then(response => {
      if (!response.ok) {
        throw new Error('Chart partial not found');
      }
      return response.text();
    }),
    fetch('partials/controls.html').then(response => {
      if (!response.ok) {
        throw new Error('Controls partial not found');
      }
      return response.text();
    })
  ])
  .then(function([headerHTML, chartHTML, controlsHTML]) {
    document.getElementById('header-placeholder').innerHTML = headerHTML;
    document.getElementById('chart-placeholder').innerHTML = chartHTML;
    document.getElementById('controls-placeholder').innerHTML = controlsHTML;

    console.log('Partials loaded successfully.');

    // Initialize language settings and chart
    changeLanguage(currentLang);
    initChart();

    // Attach event listener for timeScale input
    document.getElementById('timeScale').addEventListener('input', function(e) {
      timeScale = parseFloat(e.target.value);
      document.getElementById('scaleValue').textContent = `${timeScale}x`;
      drawChart();
    });
    
    // Attach event listeners for buttons
    document.getElementById('sineWaveGenerate').addEventListener('click', generateSineWave);
    document.getElementById('resetChartBtn').addEventListener('click', resetChart);
    document.getElementById('generateCodeBtn').addEventListener('click', generateCode);
    
    // Attach event listener for language selector
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
      languageSelect.addEventListener('change', function() {
        changeLanguage(this.value);
      });
    }
  })
  .catch(function(error) {
    console.error("Error loading partials:", error);
    document.body.innerHTML = `<p>Error loading UI components: ${error.message}</p>`;
  });
});
