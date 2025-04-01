class Calculator {
    constructor() {
      this.currentInput = '0';
      this.previousInput = '';
      this.operation = null;
      this.resetScreen = false;
      this.calcHistory = [];
      this.gradeScale = {
        'A': { min: 90, max: 100, points: 4.0 },
        'B': { min: 80, max: 89, points: 3.0 },
        'C': { min: 70, max: 79, points: 2.0 },
        'D': { min: 60, max: 69, points: 1.0 },
        'E': { min: 50, max: 59, points: 0.5 },
        'F': { min: 0, max: 49, points: 0.0 }
      };
      
      this.init();
    }
  
    init() {
      this.currentInput = '0';
      this.previousInput = '';
      this.operation = null;
      this.resetScreen = false;
      
      this.updateDisplay();
      this.initGpaCalculator();
      this.setupKeyboardSupport();
    }
  
    // ======================
    // BASIC CALCULATOR FUNCTIONS
    // ======================
  
    updateDisplay() {
      const display = document.getElementById('display');
      if (display) {
        display.textContent = this.currentInput;
      }
    }
  
    appendToDisplay(number) {
      if (this.currentInput === '0' || this.resetScreen) {
        this.currentInput = '';
        this.resetScreen = false;
      }
      
      // Prevent multiple decimal points
      if (number === '.' && this.currentInput.includes('.')) return;
      
      this.currentInput += number;
      this.updateDisplay();
    }
  
    appendOperator(op) {
      if (this.operation !== null) this.calculate();
      this.previousInput = this.currentInput;
      this.operation = op;
      this.resetScreen = true;
      
      // Update operator buttons styling
      document.querySelectorAll('.operator').forEach(btn => {
        btn.classList.remove('active');
      });
      event.target.classList.add('active');
    }
  
    calculate() {
      if (this.operation === null || this.resetScreen) return;
      
      let result;
      const prev = parseFloat(this.previousInput);
      const current = parseFloat(this.currentInput);
      
      if (isNaN(prev)) return;
      
      switch (this.operation) {
        case '+':
          result = prev + current;
          break;
        case '-':
          result = prev - current;
          break;
        case '*':
          result = prev * current;
          break;
        case '/':
          result = prev / current;
          break;
        case '%':
          result = prev % current;
          break;
        default:
          return;
      }
      
      // Add to history
      const calculation = `${this.previousInput} ${this.operation} ${this.currentInput} = ${result}`;
      this.calcHistory.push(calculation);
      this.updateCalcHistory();
      
      this.currentInput = result.toString();
      this.operation = null;
      this.resetScreen = true;
      this.updateDisplay();
      
      // Remove active class from operator buttons
      document.querySelectorAll('.operator').forEach(btn => {
        btn.classList.remove('active');
      });
    }
  
    clearAll() {
      this.currentInput = '0';
      this.previousInput = '';
      this.operation = null;
      this.updateDisplay();
    }
  
    clearEntry() {
      this.currentInput = '0';
      this.updateDisplay();
    }
  
    backspace() {
      if (this.currentInput.length === 1 || 
          (this.currentInput.length === 2 && this.currentInput.startsWith('-'))) {
        this.currentInput = '0';
      } else {
        this.currentInput = this.currentInput.slice(0, -1);
      }
      this.updateDisplay();
    }
  
    updateCalcHistory() {
      const historyDiv = document.getElementById('history');
      if (historyDiv) {
        historyDiv.innerHTML = this.calcHistory.map(entry => 
          `<div class="history-entry">${entry}</div>`
        ).reverse().join('');
      }
    }
  
    clearHistory() {
      this.calcHistory = [];
      this.updateCalcHistory();
    }
  
    // ======================
    // GPA CALCULATOR FUNCTIONS
    // ======================
  
    initGpaCalculator() {
      const container = document.getElementById('gpaSubjects');
      if (container) {
        container.innerHTML = '';
        this.addGpaSubject(); // Add one subject by default
      }
    }
  
    convertToGrade() {
      const scoreInput = document.getElementById('scoreInput');
      if (!scoreInput) return;
      
      const score = parseFloat(scoreInput.value);
      let grade = '';
      let gpa = 0;
      
      if (isNaN(score)) {
        this.showNotification('Please enter a valid score!', 'error');
        return;
      }
      
      if (score < 0 || score > 100) {
        this.showNotification('Score must be between 0-100!', 'error');
        return;
      }
      
      for (const [letter, range] of Object.entries(this.gradeScale)) {
        if (score >= range.min && score <= range.max) {
          grade = letter;
          gpa = range.points;
          break;
        }
      }
      
      const resultDiv = document.getElementById('gradeResult');
      if (resultDiv) {
        resultDiv.innerHTML = `
          <p><strong>Score:</strong> ${score.toFixed(1)}%</p>
          <p><strong>Grade:</strong> ${grade}</p>
          <p><strong>GPA Points:</strong> ${gpa.toFixed(1)}</p>
          <p><strong>Performance:</strong> ${this.getPerformanceDescription(grade)}</p>
        `;
      }
    }
  
    getPerformanceDescription(grade) {
      switch(grade) {
        case 'A': return 'Excellent';
        case 'B': return 'Good';
        case 'C': return 'Average';
        case 'D': return 'Below Average';
        case 'E': return 'Poor';
        case 'F': return 'Fail';
        default: return 'Unknown';
      }
    }
  
    addGpaSubject() {
      const container = document.getElementById('gpaSubjects');
      if (!container) return;
      
      const subjectId = Date.now(); // Unique ID
      
      const subjectDiv = document.createElement('div');
      subjectDiv.className = 'gpa-subject';
      subjectDiv.innerHTML = `
        <div class="input-group">
          <input type="text" placeholder="Subject" id="subject-${subjectId}" class="subject-name">
        </div>
        <div class="input-group">
          <select id="grade-${subjectId}" class="grade-select">
            <option value="4.0">A (4.0)</option>
            <option value="3.7">A- (3.7)</option>
            <option value="3.3">B+ (3.3)</option>
            <option value="3.0">B (3.0)</option>
            <option value="2.7">B- (2.7)</option>
            <option value="2.3">C+ (2.3)</option>
            <option value="2.0">C (2.0)</option>
            <option value="1.7">C- (1.7)</option>
            <option value="1.3">D+ (1.3)</option>
            <option value="1.0">D (1.0)</option>
            <option value="0.0">F (0.0)</option>
          </select>
        </div>
        <div class="input-group">
          <input type="number" min="0.1" max="10" step="0.1" value="1" 
                 id="credits-${subjectId}" class="credit-input" placeholder="Credits">
        </div>
        <button onclick="calculator.removeGpaSubject(this.parentElement)" class="remove-subject">
          <i class="fas fa-times"></i>
        </button>
      `;
      
      container.appendChild(subjectDiv);
    }
  
    removeGpaSubject(subjectElement) {
      subjectElement.remove();
    }
  
    calculateGPA() {
      const subjects = document.querySelectorAll('.gpa-subject');
      if (subjects.length === 0) {
        this.showNotification('Please add at least one subject!', 'error');
        return;
      }
      
      let totalQualityPoints = 0;
      let totalCredits = 0;
      let results = [];
      
      subjects.forEach(subject => {
        const gradeSelect = subject.querySelector('.grade-select');
        const creditsInput = subject.querySelector('.credit-input');
        const subjectInput = subject.querySelector('.subject-name');
        
        const grade = parseFloat(gradeSelect.value);
        const credits = parseFloat(creditsInput.value) || 1;
        const qualityPoints = grade * credits;
        
        totalQualityPoints += qualityPoints;
        totalCredits += credits;
        
        results.push({
          subject: subjectInput.value || 'Unnamed Subject',
          grade: gradeSelect.options[gradeSelect.selectedIndex].text,
          credits: credits,
          points: qualityPoints.toFixed(2)
        });
      });
      
      const gpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;
      
      let resultHTML = `<p><strong>GPA:</strong> ${gpa.toFixed(2)}</p>`;
      resultHTML += `<p><strong>Total Credits:</strong> ${totalCredits.toFixed(1)}</p>`;
      resultHTML += `<div class="gpa-details"><h4>Details:</h4><ul>`;
      resultHTML += results.map(sub => `
        <li>${sub.subject}: ${sub.grade} (${sub.credits} cr) = ${sub.points}</li>
      `).join('');
      resultHTML += `</ul></div>`;
      
      const resultDiv = document.getElementById('gpaResult');
      if (resultDiv) {
        resultDiv.innerHTML = resultHTML;
      }
    }
  
    // ======================
    // UTILITY FUNCTIONS
    // ======================
  
    setupKeyboardSupport() {
      document.addEventListener('keydown', (e) => {
        if (document.getElementById('calculator')?.style.display !== 'block') return;
        
        if (/[0-9]/.test(e.key)) this.appendToDisplay(e.key);
        else if (e.key === '.') this.appendToDisplay('.');
        else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
          this.appendOperator(e.key);
          // Simulate button press effect
          const buttons = document.querySelectorAll('.operator');
          buttons.forEach(btn => {
            if (btn.textContent === e.key) {
              btn.classList.add('active');
              setTimeout(() => btn.classList.remove('active'), 200);
            }
          });
        }
        else if (e.key === 'Enter' || e.key === '=') this.calculate();
        else if (e.key === 'Escape') this.clearAll();
        else if (e.key === 'Backspace') this.backspace();
        else if (e.key === '%') this.appendToDisplay('%');
      });
    }
  
    showNotification(message, type = 'success') {
      // Your existing notification implementation
      console.log(`[${type}] ${message}`);
    }
  }
  
  // Initialize calculator
  const calculator = new Calculator();
  
  // Global functions for button onclick handlers
  function initCalculator() {
    calculator.init();
  }
  
  function appendToDisplay(number) {
    calculator.appendToDisplay(number);
  }
  
  function appendOperator(op) {
    calculator.appendOperator(op);
  }
  
  function calculate() {
    calculator.calculate();
  }
  
  function clearAll() {
    calculator.clearAll();
  }
  
  function clearEntry() {
    calculator.clearEntry();
  }
  
  function backspace() {
    calculator.backspace();
  }
  
  function clearHistory() {
    calculator.clearHistory();
  }
  
  function convertToGrade() {
    calculator.convertToGrade();
  }
  
  function addGpaSubject() {
    calculator.addGpaSubject();
  }
  
  function calculateGPA() {
    calculator.calculateGPA();
  }