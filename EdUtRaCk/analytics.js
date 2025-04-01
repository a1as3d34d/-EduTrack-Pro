class PerformanceAnalytics {
    constructor() {
      this.gradeValues = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 };
      this.chartColors = [
        'rgba(74, 144, 226, 0.7)',
        'rgba(220, 53, 69, 0.7)',
        'rgba(40, 167, 69, 0.7)',
        'rgba(255, 193, 7, 0.7)',
        'rgba(23, 162, 184, 0.7)'
      ];
      this.initElements();
      this.setupEventListeners();
    }
  
    initElements() {
      this.elements = {
        performanceChartCtx: document.getElementById('performanceChart')?.getContext('2d'),
        dashboardChartCtx: document.getElementById('dashboardChart')?.getContext('2d'),
        classSelect: document.getElementById('analyticsClass'),
        subjectSelect: document.getElementById('analyticsSubject'),
        statElements: {
          topStudent: document.getElementById('topStudent'),
          topStudentGpa: document.getElementById('topStudentGpa'),
          mostImproved: document.getElementById('mostImproved'),
          improvementRate: document.getElementById('improvementRate'),
          bestSubject: document.getElementById('bestSubject'),
          subjectAvg: document.getElementById('subjectAvg'),
          bestProgram: document.getElementById('bestProgram'),
          programAvg: document.getElementById('programAvg'),
          totalStudents: document.getElementById('totalStudents'),
          attendanceRate: document.getElementById('attendanceRate'),
          averageGpa: document.getElementById('averageGpa'),
          topProgram: document.getElementById('topProgram'),
          programStats: document.getElementById('programStats')
        }
      };
    }
  
    setupEventListeners() {
      this.elements.classSelect?.addEventListener('change', () => this.updateSubjectDropdown());
      this.elements.classSelect?.addEventListener('change', () => this.updatePerformanceChart());
      this.elements.subjectSelect?.addEventListener('change', () => this.updatePerformanceChart());
    }
  
    // Main update methods
    updatePerformanceChart() {
      if (!this.elements.performanceChartCtx) return;
      
      const className = this.elements.classSelect.value;
      const subjectName = this.elements.subjectSelect.value;
      const filteredStudents = this.filterStudents(className, subjectName);
  
      this.clearChart(this.elements.performanceChartCtx);
  
      if (filteredStudents.length === 0) {
        this.displayEmptyStats();
        return;
      }
  
      const chartData = this.prepareChartData(filteredStudents, subjectName);
      const stats = this.calculateStatistics(filteredStudents, className, subjectName);
  
      this.renderPerformanceChart(chartData);
      this.updateStatBoxes(stats);
    }
  
    updateDashboard() {
      this.updateBasicStats();
      this.updateDashboardChart();
      // updateActivityLog(); // Uncomment if you have this function
    }
  
    // Data processing methods
    filterStudents(className, subjectName) {
      let filtered = className ? 
        students.filter(student => student.className === className) : 
        [...students];
  
      if (subjectName) {
        filtered = filtered.filter(student => student.subjects[subjectName]);
      }
  
      return filtered;
    }
  
    prepareChartData(students, subjectName) {
      const labels = students.map(student => student.name);
      const datasets = [];
  
      if (subjectName) {
        datasets.push(this.createSubjectDataset(students, subjectName));
      } else {
        datasets.push(this.createAverageDataset(students));
      }
  
      return { labels, datasets };
    }
  
    createSubjectDataset(students, subjectName) {
      return {
        label: `${subjectName} Grade`,
        data: students.map(student => {
          const grade = student.subjects[subjectName]?.grade;
          return grade ? this.gradeValues[grade] : null;
        }),
        backgroundColor: this.chartColors[0],
        borderColor: this.chartColors[0].replace('0.7', '1'),
        borderWidth: 1
      };
    }
  
    createAverageDataset(students) {
      return {
        label: 'Average Grade',
        data: students.map(student => this.calculateStudentAverage(student)),
        backgroundColor: this.chartColors[1],
        borderColor: this.chartColors[1].replace('0.7', '1'),
        borderWidth: 1
      };
    }
  
    calculateStatistics(students, className, subjectName) {
      const stats = {
        topStudent: '-',
        topGPA: 0,
        mostImproved: '-',
        improvementRate: '+0%',
        bestSubject: '-',
        subjectAvg: 0,
        bestProgram: '-',
        programAvg: 0
      };
  
      if (students.length === 0) return stats;
  
      // Calculate subject averages if not viewing single subject
      if (!subjectName) {
        const subjectStats = this.calculateSubjectAverages(students);
        stats.bestSubject = subjectStats.bestSubject;
        stats.subjectAvg = subjectStats.highestAvg;
      }
  
      // Find top student
      students.forEach(student => {
        const gpa = calculateStudentGPA(student);
        if (gpa !== null && gpa > stats.topGPA) {
          stats.topGPA = gpa;
          stats.topStudent = student.name;
        }
      });
  
      // Find best program if not filtered by class
      if (!className) {
        const programStats = this.calculateProgramAverages();
        stats.bestProgram = programStats.bestProgram;
        stats.programAvg = programStats.highestAvg;
      }
  
      return stats;
    }
  
    calculateSubjectAverages(students) {
      const subjectAverages = {};
      const subjectCounts = {};
      
      students.forEach(student => {
        Object.entries(student.subjects).forEach(([sub, data]) => {
          if (data.grade && this.gradeValues[data.grade]) {
            subjectAverages[sub] = (subjectAverages[sub] || 0) + this.gradeValues[data.grade];
            subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;
          }
        });
      });
  
      let bestSubject = '-';
      let highestAvg = 0;
  
      for (const [sub, total] of Object.entries(subjectAverages)) {
        const avg = total / subjectCounts[sub];
        if (avg > highestAvg) {
          highestAvg = avg;
          bestSubject = sub;
        }
      }
  
      return { bestSubject, highestAvg };
    }
  
    calculateProgramAverages() {
      const programAverages = {};
      const programCounts = {};
      
      students.forEach(student => {
        const gpa = calculateStudentGPA(student);
        if (gpa !== null) {
          programAverages[student.className] = (programAverages[student.className] || 0) + gpa;
          programCounts[student.className] = (programCounts[student.className] || 0) + 1;
        }
      });
  
      let bestProgram = '-';
      let highestAvg = 0;
  
      for (const [program, total] of Object.entries(programAverages)) {
        const avg = total / programCounts[program];
        if (avg > highestAvg) {
          highestAvg = avg;
          bestProgram = program;
        }
      }
  
      return { bestProgram, highestAvg };
    }
  
    // Chart rendering methods
    renderPerformanceChart(data) {
      if (!this.elements.performanceChartCtx) return;
  
      this.elements.performanceChartCtx.chart = new Chart(this.elements.performanceChartCtx, {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              max: 5,
              ticks: {
                callback: value => this.convertToLetterGrade(value)
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: context => {
                  const value = context.raw;
                  return `${context.dataset.label}: ${value !== null ? this.convertToLetterGrade(value) : 'No grade'}`;
                }
              }
            }
          }
        }
      });
    }
  
    updateDashboardChart() {
      if (!this.elements.dashboardChartCtx || students.length === 0) {
        this.clearChart(this.elements.dashboardChartCtx);
        return;
      }
  
      const programData = this.calculateProgramDistribution();
      this.renderDashboardChart(programData);
    }
  
    renderDashboardChart(programData) {
      if (!this.elements.dashboardChartCtx) return;
  
      this.elements.dashboardChartCtx.chart = new Chart(this.elements.dashboardChartCtx, {
        type: 'bar',
        data: {
          labels: programData.labels,
          datasets: [{
            label: 'Students by Program',
            data: programData.values,
            backgroundColor: this.chartColors,
            borderColor: this.chartColors.map(color => color.replace('0.7', '1')),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            tooltip: { callbacks: { label: context => `${context.dataset.label}: ${context.raw}` } }
          },
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
      });
    }
  
    calculateProgramDistribution() {
      const programs = {};
      students.forEach(student => {
        programs[student.className] = (programs[student.className] || 0) + 1;
      });
  
      return {
        labels: Object.keys(programs),
        values: Object.values(programs)
      };
    }
  
    // Helper methods
    updateSubjectDropdown() {
      const className = this.elements.classSelect.value;
      const filteredStudents = this.filterStudents(className);
      const subjects = new Set();
  
      filteredStudents.forEach(student => {
        Object.keys(student.subjects).forEach(subject => subjects.add(subject));
      });
  
      const sortedSubjects = Array.from(subjects).sort();
      this.elements.subjectSelect.innerHTML = '<option value="">All Subjects</option>';
      
      sortedSubjects.forEach(subject => {
        this.elements.subjectSelect.appendChild(new Option(subject, subject));
      });
    }
  
    calculateStudentAverage(student) {
      const grades = Object.values(student.subjects)
        .map(data => data.grade ? this.gradeValues[data.grade] : null)
        .filter(grade => grade !== null);
  
      return grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : null;
    }
  
    convertToLetterGrade(value) {
      const gradeMap = {5: 'A', 4: 'B', 3: 'C', 2: 'D', 1: 'E', 0: 'F'};
      return gradeMap[value] || '';
    }
  
    clearChart(ctx) {
      if (ctx?.chart) {
        ctx.chart.destroy();
        ctx.chart = null;
      }
      ctx?.canvas?.style?.setProperty('display', 'none');
    }
  
    displayEmptyStats() {
      Object.entries(this.elements.statElements).forEach(([key, element]) => {
        if (key === 'topStudentGpa') element.textContent = 'GPA: 0.0';
        else if (key === 'subjectAvg') element.textContent = 'Avg: 0.0';
        else if (key === 'programAvg') element.textContent = 'Avg: 0.0';
        else if (key === 'attendanceRate') element.textContent = '0%';
        else if (key === 'averageGpa') element.textContent = '0.00';
        else if (key === 'programStats') element.textContent = '0 students';
        else element.textContent = '-';
      });
    }
  
    updateStatBoxes(stats) {
      this.elements.statElements.topStudent.textContent = stats.topStudent;
      this.elements.statElements.topStudentGpa.textContent = `GPA: ${stats.topGPA.toFixed(2)}`;
      this.elements.statElements.mostImproved.textContent = stats.mostImproved;
      this.elements.statElements.improvementRate.textContent = stats.improvementRate;
      this.elements.statElements.bestSubject.textContent = stats.bestSubject;
      this.elements.statElements.subjectAvg.textContent = `Avg: ${stats.subjectAvg.toFixed(2)}`;
      this.elements.statElements.bestProgram.textContent = stats.bestProgram;
      this.elements.statElements.programAvg.textContent = `Avg: ${stats.programAvg.toFixed(2)}`;
    }
  
    updateBasicStats() {
      this.elements.statElements.totalStudents.textContent = students.length;
      
      // Attendance rate
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendance.filter(a => a.date === today);
      const presentCount = todayAttendance.filter(a => a.present).length;
      const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;
      this.elements.statElements.attendanceRate.textContent = `${attendanceRate}%`;
      
      // Average GPA
      let totalGPA = 0;
      let studentCountWithGrades = 0;
      
      students.forEach(student => {
        const gpa = calculateStudentGPA(student);
        if (gpa !== null) {
          totalGPA += gpa;
          studentCountWithGrades++;
        }
      });
      
      const avgGPA = studentCountWithGrades > 0 ? (totalGPA / studentCountWithGrades).toFixed(2) : 0;
      this.elements.statElements.averageGpa.textContent = avgGPA;
      
      // Top program
      const programCounts = {};
      students.forEach(student => {
        programCounts[student.className] = (programCounts[student.className] || 0) + 1;
      });
      
      let topProgram = '-';
      let maxCount = 0;
      for (const [program, count] of Object.entries(programCounts)) {
        if (count > maxCount) {
          maxCount = count;
          topProgram = program;
        }
      }
      
      this.elements.statElements.topProgram.textContent = topProgram;
      this.elements.statElements.programStats.textContent = `${maxCount} students`;
    }
  }
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const analytics = new PerformanceAnalytics();
    analytics.updatePerformanceChart();
    analytics.updateDashboard();
  });