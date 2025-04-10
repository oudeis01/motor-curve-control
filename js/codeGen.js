function generateSineWave() {
  const amplitude = parseFloat(document.getElementById('sineAmplitude').value);
  const frequency = parseFloat(document.getElementById('sineFrequency').value);
  const append = document.getElementById('appendWave').checked;
  const startX = append && dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].x : 0;
  const duration = timeScale - startX;
  const points = [];
  for (let t = 0; t <= duration; t += 0.02) {
    const x = startX + t;
    const y = 50 + amplitude * Math.sin(2 * Math.PI * frequency * t);
    points.push({ x: x, y: y });
  }
  dataPoints = dataPoints.filter(p => p.x < startX).concat(points);
  if (typeof drawChart === "function") {
    drawChart();
  }
}

function resetChart() {
  dataPoints = [];
  if (typeof drawChart === "function") {
    drawChart();
  }
}

function generateCode() {
  if (dataPoints.length === 0) {
    alert(i18n[currentLang]['alertPoints']);
    return;
  }
  const sortedPoints = [...dataPoints].sort((a, b) => a.x - b.x);
  const totalDuration = sortedPoints[sortedPoints.length - 1].x; // Get last time point

  let code = `#include <math.h>\n\n`;
  code += `const int NUM_POINTS = ${sortedPoints.length};\n`;
  code += `float timePoints[NUM_POINTS] = {${sortedPoints.map(p => p.x.toFixed(2)).join(', ')}};\n`;
  code += `float values[NUM_POINTS] = {${sortedPoints.map(p => p.y.toFixed(2)).join(', ')}};\n`;
  code += `const float TOTAL_DURATION = ${totalDuration.toFixed(2)}; // Total curve duration\n\n`; // Add total duration

  code += `void setup() {\n`;
  code += `  pinMode(10, OUTPUT);\n`;
  code += `  TCCR1A = _BV(COM1A1) | _BV(WGM10);\n`;
  code += `  TCCR1B = _BV(CS10);\n`;
  code += `}\n\n`;

  code += `void loop() {\n`;
  code += `  float currentTime = fmod(millis() / 1000.0, TOTAL_DURATION); `;
  code += `  float outputValue = 0.0;\n\n`;
  code += `  for(int i = 0; i < NUM_POINTS - 1; i++) {\n`;
  code += `    if(currentTime >= timePoints[i] && currentTime <= timePoints[i+1]) {\n`;
  code += `      float t = (currentTime - timePoints[i]) / (timePoints[i+1] - timePoints[i]);\n`;
  code += `      outputValue = values[i] + t * (values[i+1] - values[i]);\n`;
  code += `      break;\n`;
  code += `    }\n  }\n\n`;
  code += `  int pwmValue = constrain(outputValue * 2.55, 0, 255);\n`;
  code += `  analogWrite(10, pwmValue);\n`;
  code += `  delay(10);\n`;
  code += `}\n`;


  // If running in Electron (with electronAPI defined), save the file
  if (window.electronAPI && typeof window.electronAPI.saveCode === 'function') {
    window.electronAPI.saveCode(code).then(filename => {
      const notification = document.getElementById('genNotification');
      if (filename) {
        notification.textContent = `${i18n[currentLang]['fileGenerated']} ${filename.displayPath}`;
        notification.style.display = 'block';
        setTimeout(() => { notification.style.display = 'none'; }, 1000);
      }
    });
  } else {
    // For testing outside Electron, display the code in an alert.
    alert("Generated Code:\n" + code);
  }
}
