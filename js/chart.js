// Global variables for chart state
let dataPoints = [];
let timeScale = 1;
let canvas, ctx;
let isDragging = false;
let selectedPointIndex = -1;
const pointRadius = 5;
const gridColor = '#3d3d3d';
const axisColor = '#666';
const pointColor = '#ff4444';
const lineColor = '#4a90e2';
const CHART_MARGIN = { left: 50, right: 80, top: 20, bottom: 40 };
let devicePixelRatio = 1;

function initChart() {
  canvas = document.getElementById('myChart');
  if (!canvas) {
    console.error("Canvas element with id 'myChart' not found!");
    return;
  }
  ctx = canvas.getContext('2d');
  const container = document.getElementById('chartContainer');
  devicePixelRatio = window.devicePixelRatio || 1;
  const containerWidth = container.clientWidth - 100; // extra margin
  const containerHeight = 400;

  canvas.style.width = containerWidth + 'px';
  canvas.style.height = containerHeight + 'px';
  canvas.width = containerWidth * devicePixelRatio;
  canvas.height = containerHeight * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);

  // Attach event listeners for user interaction
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  canvas.addEventListener('dblclick', handleDoubleClick);

  window.addEventListener('resize', () => {
    const container = document.getElementById('chartContainer');
    canvas.style.width = container.clientWidth + 'px';
    canvas.width = container.clientWidth * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    drawChart();
  });

  drawChart();
}

function drawChart() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawAxes();
  drawAxisLabels();
  drawDataPoints();
  drawLine();
}

function drawGrid() {
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;
  const canvasWidth = canvas.width / devicePixelRatio;
  const canvasHeight = canvas.height / devicePixelRatio;
  for (let x = 0; x <= timeScale; x += 0.1) {
    const screenX = xToScreen(x);
    ctx.beginPath();
    ctx.moveTo(screenX, CHART_MARGIN.top);
    ctx.lineTo(screenX, canvasHeight - CHART_MARGIN.bottom);
    ctx.stroke();
  }
  for (let y = 0; y <= 100; y += 10) {
    const screenY = yToScreen(y);
    ctx.beginPath();
    ctx.moveTo(CHART_MARGIN.left, screenY);
    ctx.lineTo(canvasWidth - CHART_MARGIN.right, screenY);
    ctx.stroke();
  }
}

function drawAxes() {
  const canvasWidth = canvas.width / devicePixelRatio;
  const canvasHeight = canvas.height / devicePixelRatio;
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 1;
  // X axis
  ctx.beginPath();
  ctx.moveTo(CHART_MARGIN.left, canvasHeight - CHART_MARGIN.bottom);
  ctx.lineTo(canvasWidth - CHART_MARGIN.right, canvasHeight - CHART_MARGIN.bottom);
  ctx.stroke();
  // Y axis
  ctx.beginPath();
  ctx.moveTo(CHART_MARGIN.left, CHART_MARGIN.top);
  ctx.lineTo(CHART_MARGIN.left, canvasHeight - CHART_MARGIN.bottom);
  ctx.stroke();
}

function drawAxisLabels() {
  const canvasHeight = canvas.height / devicePixelRatio;
  ctx.fillStyle = axisColor;
  ctx.font = '12px Arial';
  
  // X-axis labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  let xStep = 0.1;
  if (timeScale > 1 && timeScale <= 2) xStep = 0.2;
  else if (timeScale > 2 && timeScale <= 4) xStep = 0.5;
  else if (timeScale > 4 && timeScale <= 6) xStep = 1.0;
  else if (timeScale > 6) xStep = Math.ceil(timeScale / 6);
  for (let x = 0; x <= timeScale; x += xStep) {
    const screenX = xToScreen(x);
    if (screenX > CHART_MARGIN.left && screenX < (canvas.width / devicePixelRatio - CHART_MARGIN.right)) {
      ctx.fillText(x.toFixed(1), screenX, canvasHeight - CHART_MARGIN.bottom + 5);
    }
  }
  
  // Y-axis labels
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let y = 0; y <= 100; y += 10) {
    const screenY = yToScreen(y);
    if (screenY > CHART_MARGIN.top && screenY < (canvasHeight - CHART_MARGIN.bottom)) {
      ctx.fillText(y + '%', CHART_MARGIN.left - 10, screenY);
    }
  }
}

function drawDataPoints() {
  dataPoints.forEach(point => {
    ctx.beginPath();
    ctx.arc(xToScreen(point.x), yToScreen(point.y), pointRadius, 0, Math.PI * 2);
    ctx.fillStyle = pointColor;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  });
}

function drawLine() {
  if (dataPoints.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(xToScreen(dataPoints[0].x), yToScreen(dataPoints[0].y));
  dataPoints.slice(1).forEach(point => {
    ctx.lineTo(xToScreen(point.x), yToScreen(point.y));
  });
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function xToScreen(x) {
  const canvasWidth = canvas.width / devicePixelRatio;
  const availableWidth = canvasWidth - CHART_MARGIN.left - CHART_MARGIN.right - 20;
  return CHART_MARGIN.left + (x / timeScale) * availableWidth;
}

function yToScreen(y) {
  const canvasHeight = canvas.height / devicePixelRatio;
  const availableHeight = canvasHeight - CHART_MARGIN.top - CHART_MARGIN.bottom;
  return CHART_MARGIN.top + availableHeight - (y / 100) * availableHeight;
}

function screenToX(screenX) {
  const canvasWidth = canvas.width / devicePixelRatio;
  const availableWidth = canvasWidth - CHART_MARGIN.left - CHART_MARGIN.right;
  return ((screenX - CHART_MARGIN.left) / availableWidth) * timeScale;
}

function screenToY(screenY) {
  const canvasHeight = canvas.height / devicePixelRatio;
  const availableHeight = canvasHeight - CHART_MARGIN.top - CHART_MARGIN.bottom;
  return ((availableHeight - (screenY - CHART_MARGIN.top)) / availableHeight) * 100;
}

function handleMouseDown(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / devicePixelRatio / rect.width;
  const scaleY = canvas.height / devicePixelRatio / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;

  selectedPointIndex = findNearestPoint(x, y);
  if (selectedPointIndex === -1) {
    const newX = Math.max(0, Math.min(screenToX(x), timeScale));
    const newY = Math.max(0, Math.min(screenToY(y), 100));
    dataPoints.push({ x: newX, y: newY });
    dataPoints.sort((a, b) => a.x - b.x);
    drawChart();
  } else {
    isDragging = true;
  }
}

function handleMouseMove(e) {
  if (!isDragging) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / devicePixelRatio / rect.width;
  const scaleY = canvas.height / devicePixelRatio / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  const newX = Math.max(0, Math.min(screenToX(x), timeScale));
  const newY = Math.max(0, Math.min(screenToY(y), 100));
  dataPoints[selectedPointIndex] = { x: newX, y: newY };
  dataPoints.sort((a, b) => a.x - b.x);
  selectedPointIndex = dataPoints.findIndex(p => p.x === newX && p.y === newY);
  drawChart();
}

function handleMouseUp() {
  isDragging = false;
  selectedPointIndex = -1;
}

function handleDoubleClick(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / devicePixelRatio / rect.width;
  const scaleY = canvas.height / devicePixelRatio / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top) * scaleY;
  const index = findNearestPoint(x, y);
  if (index !== -1 && distance(x, y, xToScreen(dataPoints[index].x), yToScreen(dataPoints[index].y)) < 15) {
    dataPoints.splice(index, 1);
    drawChart();
  }
}

function findNearestPoint(x, y) {
  let minDist = Infinity;
  let foundIndex = -1;
  dataPoints.forEach((point, index) => {
    const pointX = xToScreen(point.x);
    const pointY = yToScreen(point.y);
    const dx = x - pointX;
    const dy = y - pointY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 15 && dist < minDist) {
      minDist = dist;
      foundIndex = index;
    }
  });
  return foundIndex;
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
