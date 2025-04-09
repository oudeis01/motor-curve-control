const i18n = {
    'en': {
      'timeScale': 'Time Scale: ',
      'generateCode': 'Generate Arduino Code',
      'resetChart': 'Reset Chart',
      'sineWave': 'Sine Wave Generator',
      'amplitude': 'Amplitude (%): ',
      'frequency': 'Frequency (Hz): ',
      'appendWave': 'Append to last point',
      'generateWave': 'Generate Sine Wave',
      'fileGenerated': 'File generated: ',
      'alertPoints': 'Please create some points first!'
    },
    'zh': {
      'timeScale': '时间比例: ',
      'generateCode': '生成Arduino代码',
      'resetChart': '重置图表',
      'sineWave': '正弦波生成器',
      'amplitude': '幅度(%): ',
      'frequency': '频率(Hz): ',
      'appendWave': '追加到最后一点',
      'generateWave': '生成正弦波',
      'fileGenerated': '文件已生成: ',
      'alertPoints': '请先创建一些数据点!'
    },
    'ko': {
      'timeScale': '시간 축척: ',
      'generateCode': '아두이노 코드 생성',
      'resetChart': '차트 리셋',
      'sineWave': '사인파 생성기',
      'amplitude': '진폭(%): ',
      'frequency': '주파수(Hz): ',
      'appendWave': '마지막 지점에 추가',
      'generateWave': '사인파 생성',
      'fileGenerated': '파일 생성됨: ',
      'alertPoints': '먼저 점을 생성해 주세요!'
    }
  };
  
  let currentLang = localStorage.getItem('appLang') || 'ko';
  
  function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('appLang', lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = i18n[lang][key];
    });
    const headerLanguageSelect = document.getElementById('languageSelect');
    if (headerLanguageSelect) {
      headerLanguageSelect.value = lang;
    }
    // Update axis labels if they exist
    const xAxisLabel = document.getElementById('x-axis-label');
    const yAxisLabel = document.getElementById('y-axis-label');
    if (xAxisLabel) {
      xAxisLabel.textContent = lang === 'en' ? 'Time (sec)' : (lang === 'zh' ? '时间 (秒)' : '시간 (초)');
    }
    if (yAxisLabel) {
      yAxisLabel.textContent = lang === 'en' ? 'Speed (%)' : (lang === 'zh' ? '速度 (%)' : '속도 (%)');
    }
    if (typeof drawChart === "function") {
      drawChart();
    }
  }
  