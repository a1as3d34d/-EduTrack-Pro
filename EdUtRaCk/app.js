class SchoolManagementSystem {
    constructor() {
      this.students = JSON.parse(localStorage.getItem('students')) || [];
      this.attendance = JSON.parse(localStorage.getItem('attendance')) || [];
      this.activityLog = JSON.parse(localStorage.getItem('activityLog')) || [];
      this.calcHistory = [];
      this.currentSubject = null;
      this.currentStudentIndex = null;
      this.pendingAction = null;
  
      this.subjectsByClass = {
        Science: ["Mathematics", "Physics", "Chemistry", "Biology", "Further Mathematics", "Agricultural Science", "ICT", "Technical Drawing", "Physical Education", "Economics", "Civic Education", "English Language"],
        Art: ["Fine Arts", "Visual Arts", "Music", "Literature in English", "History", "Government", "Religious Studies", "Drama", "Textiles", "Graphic Design", "Ceramics", "Photography", "Cultural and Creative Arts", "English Language", "Mathematics", "Civic Education", "Fashion Designing", "Textile Trade", "Leatherwork", "Painting and Decorating", "Sculpture"],
        Accounting: ["Introduction to Accounting", "Principles of Double Entry", "Preparation of Financial Statements", "Bank Reconciliation", "Trial Balance", "Control Accounts", "Depreciation of Assets", "Partnership Accounts", "Company Accounts", "Cash Book and Petty Cash Book", "Budgeting and Budgetary Control", "Cost Accounting", "Public Sector Accounting", "Ethics in Accounting", "Interpretation of Financial Statements"]
      };
  
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
      this.setupTheme();
      this.setupCurrentYear();
      this.setupEventListeners();
      this.setupTabNavigation();
      this.loadInitialViews();
    }
  
    setupTheme() {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i> Light Mode';
      }
    }
  
    setupCurrentYear() {
      document.getElementById('year').textContent = new Date().getFullYear();
    }
  
    setupEventListeners() {
      document.getElementById('themeToggle')?.addEventListener('click', () => this.toggleTheme());
      document.getElementById('confirmActionBtn')?.addEventListener('click', () => this.confirmAction());
      document.getElementById('cancelActionBtn')?.addEventListener('click', () => this.closeModal('confirmModal'));
    }
  
    setupTabNavigation() {
      document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
          const tabId = e.currentTarget.getAttribute('onclick').match(/'(.*?)'/)[1];
          this.showTab(tabId);
        });
      });
  
      window.addEventListener('hashchange', () => this.handleHashNavigation());
    }
  
    loadInitialViews() {
      this.updateDashboard();
      this.viewAllStudents();
      this.loadSubjectsForAdvancedSearch();
  
      if (window.location.hash === '#calculator') {
        this.initCalculator();
      }
    }
  
    // =============================
    // CORE APPLICATION FUNCTIONALITY
    // =============================
  
    showTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
      
      const tabElement = document.getElementById(tabId);
      if (tabElement) {
        tabElement.classList.add('active');
        document.querySelector(`.tab[onclick*="${tabId}"]`).classList.add('active');
      }
  
      this.refreshTabContent(tabId);
      window.location.hash = tabId;
    }
  
    refreshTabContent(tabId) {
      switch(tabId) {
        case 'dashboard':
          this.updateDashboard();
          break;
        case 'analytics':
          this.updatePerformanceChart();
          break;
        case 'view':
          this.viewAllStudents();
          break;
        case 'calculator':
          this.initCalculator();
          break;
        case 'attendance':
          this.setDefaultAttendanceDate();
          this.loadAttendance();
          break;
      }
    }
  
    handleHashNavigation() {
      if (window.location.hash) {
        const tabId = window.location.hash.substring(1);
        this.showTab(tabId);
      }
    }
  
    toggleTheme() {
      const body = document.body;
      body.classList.toggle('dark-mode');
      const isDark = body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      
      const themeToggle = document.getElementById('themeToggle');
      themeToggle.innerHTML = isDark 
        ? '<i class="fas fa-sun"></i> Light Mode' 
        : '<i class="fas fa-moon"></i> Dark Mode';
    }
  
    // =============================
    // NOTIFICATION AND MODAL SYSTEM
    // =============================
  
    showNotification(message, type = 'success', duration = 3000) {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.innerHTML = `<i class="fas fa-${this.getIconForType(type)}"></i> ${message}`;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
      }, duration - 500);
    }
  
    getIconForType(type) {
      const icons = {
        success: 'check-circle',
        error: 'times-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
      };
      return icons[type] || 'info-circle';
    }
  
    openModal(modalId) {
      document.getElementById(modalId).style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  
    closeModal(modalId) {
      document.getElementById(modalId).style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  
    showConfirmation(title, message, action) {
      document.getElementById('confirmTitle').innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${title}`;
      document.getElementById('confirmMessage').textContent = message;
      this.pendingAction = action;
      this.openModal('confirmModal');
    }
  
    confirmAction() {
      if (this.pendingAction && typeof this.pendingAction === 'function') {
        this.pendingAction();
      }
      this.closeModal('confirmModal');
      this.pendingAction = null;
    }
  
    // =============================
    // ACTIVITY LOG SYSTEM
    // =============================
  
    logActivity(action, details = '') {
      const timestamp = new Date().toISOString();
      this.activityLog.unshift({ timestamp, action, details });
      
      // Maintain log size
      if (this.activityLog.length > 50) {
        this.activityLog = this.activityLog.slice(0, 50);
      }
      
      localStorage.setItem('activityLog', JSON.stringify(this.activityLog));
      this.updateActivityLog();
    }
  
    updateActivityLog() {
      const logContainer = document.getElementById('activityLog');
      if (!logContainer) return;
      
      logContainer.innerHTML = this.activityLog.map(activity => `
        <div class="activity-item">
          <div class="activity-time">${this.formatDateTime(activity.timestamp)}</div>
          <div class="activity-action">${activity.action}</div>
          ${activity.details ? `<div class="activity-details">${activity.details}</div>` : ''}
        </div>
      `).join('');
    }
  
    formatDateTime(timestamp) {
      return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  
    // =============================
    // STUDENT MANAGEMENT FUNCTIONS
    // =============================
  
    viewAllStudents() {
      const container = document.getElementById('studentList');
      if (!container) return;
  
      if (this.students.length === 0) {
        container.innerHTML = '<div class="empty-state">No students found</div>';
        return;
      }
  
      container.innerHTML = this.students.map((student, index) => `
        <div class="student-card">
          <div class="student-info">
            <h3>${student.name}</h3>
            <p>${student.className} • ${student.id || 'N/A'}</p>
          </div>
          <div class="student-actions">
            <button class="btn btn-sm btn-view" onclick="sms.viewStudentDetails(${index})">
              <i class="fas fa-eye"></i> View
            </button>
            <button class="btn btn-sm btn-edit" onclick="sms.editStudent(${index})">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-delete" onclick="sms.deleteStudentPrompt(${index})">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      `).join('');
    }
  
    viewStudentDetails(index) {
      const student = this.students[index];
      const modal = document.getElementById('studentDetailsModal');
      
      modal.querySelector('.student-name').textContent = student.name;
      modal.querySelector('.student-class').textContent = student.className;
      modal.querySelector('.student-id').textContent = student.id || 'N/A';
      
      // Display subjects and grades
      const subjectsContainer = modal.querySelector('.student-subjects');
      subjectsContainer.innerHTML = Object.entries(student.subjects || {}).map(([subject, data]) => `
        <div class="subject-item">
          <span class="subject-name">${subject}</span>
          <span class="subject-grade ${data.grade?.toLowerCase() || ''}">${data.grade || 'N/A'}</span>
        </div>
      `).join('');
      
      this.openModal('studentDetailsModal');
    }
  
    deleteStudentPrompt(index) {
      const student = this.students[index];
      this.showConfirmation(
        "Delete Student",
        `Are you sure you want to delete ${student.name}? This action cannot be undone.`,
        () => this.deleteStudent(index)
      );
    }
  
    deleteStudent(index) {
      const deletedStudent = this.students.splice(index, 1)[0];
      localStorage.setItem('students', JSON.stringify(this.students));
      
      this.logActivity('Student deleted', `Deleted ${deletedStudent.name} (${deletedStudent.className})`);
      this.showNotification('Student deleted successfully');
      this.viewAllStudents();
    }
  
    // =============================
    // ATTENDANCE MANAGEMENT
    // =============================
  
    setDefaultAttendanceDate() {
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('attendanceDate').value = today;
    }
  
    loadAttendance() {
      const date = document.getElementById('attendanceDate').value;
      const className = document.getElementById('attendanceClass').value;
      
      if (!date) {
        this.showNotification('Please select a date first!', "error");
        return;
      }
  
      const filteredAttendance = this.attendance.filter(record => 
        record.date === date && 
        (className ? record.className === className : true)
      );
      
      const attendanceList = document.getElementById('attendanceList');
      const filteredStudents = className ? 
        this.students.filter(s => s.className === className) : 
        this.students;
      
      if (filteredStudents.length === 0) {
        attendanceList.innerHTML = '<div class="notification info">No students found</div>';
        document.getElementById('attendancePercentage').textContent = '0%';
        document.getElementById('attendanceCounts').textContent = 'Present: 0 / Absent: 0 / Total: 0';
        return;
      }
  
      let presentCount = 0;
      
      attendanceList.innerHTML = filteredStudents.map(student => {
        const attendanceRecord = filteredAttendance.find(record => record.name === student.name);
        const isPresent = attendanceRecord ? attendanceRecord.present : false;
        
        if (isPresent) presentCount++;
        
        return `
          <div class="attendance-card">
            <label>${student.name} <small>(${student.className})</small></label>
            <label class="switch">
              <input type="checkbox" id="${student.name}-${date}" ${isPresent ? 'checked' : ''}>
              <span class="slider round"></span>
            </label>
          </div>
        `;
      }).join('');
      
      const attendancePercentage = Math.round((presentCount / filteredStudents.length) * 100);
      document.getElementById('attendancePercentage').textContent = `${attendancePercentage}%`;
      document.getElementById('attendanceCounts').textContent = 
        `Present: ${presentCount} / Absent: ${filteredStudents.length - presentCount} / Total: ${filteredStudents.length}`;
    }
  
    // =============================
    // INITIALIZATION
    // =============================
  
    loadSubjectsForAdvancedSearch() {
      // Implementation would go here
    }
  
    initCalculator() {
      // Implementation would go here
    }
  }
  
  // Initialize the application
  const sms = new SchoolManagementSystem();