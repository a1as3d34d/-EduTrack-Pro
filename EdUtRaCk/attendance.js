class AttendanceManager {
    constructor() {
      this.attendance = JSON.parse(localStorage.getItem('attendance')) || [];
      this.students = JSON.parse(localStorage.getItem('students')) || [];
      this.cacheDOMElements();
      this.setupEventListeners();
    }
  
    cacheDOMElements() {
      this.dom = {
        dateInput: document.getElementById('attendanceDate'),
        classSelect: document.getElementById('attendanceClass'),
        attendanceList: document.getElementById('attendanceList'),
        attendancePercentage: document.getElementById('attendancePercentage'),
        attendanceCounts: document.getElementById('attendanceCounts'),
        saveBtn: document.getElementById('saveAttendanceBtn'),
        printBtn: document.getElementById('printAttendanceBtn'),
        clearBtn: document.getElementById('clearAttendanceBtn')
      };
    }
  
    setupEventListeners() {
      this.dom.dateInput.addEventListener('change', () => this.loadAttendance());
      this.dom.classSelect.addEventListener('change', () => this.loadAttendance());
      this.dom.saveBtn?.addEventListener('click', () => this.saveAttendance());
      this.dom.printBtn?.addEventListener('click', () => this.printAttendance());
      this.dom.clearBtn?.addEventListener('click', () => this.clearAttendance());
    }
  
    loadAttendance() {
      const { dateInput, classSelect, attendanceList, attendancePercentage, attendanceCounts } = this.dom;
      const date = dateInput.value;
      const className = classSelect.value;
      
      if (!date) {
        showNotification('Please select a date first!', "error");
        return;
      }
  
      try {
        const filteredAttendance = this.filterAttendanceRecords(date, className);
        const filteredStudents = this.filterStudents(className);
        
        if (filteredStudents.length === 0) {
          this.displayEmptyState(attendanceList, attendancePercentage, attendanceCounts);
          return;
        }
  
        const presentCount = this.renderAttendanceList(filteredStudents, filteredAttendance, attendanceList);
        this.updateStats(presentCount, filteredStudents.length, attendancePercentage, attendanceCounts);
      } catch (error) {
        console.error('Error loading attendance:', error);
        showNotification('Failed to load attendance data', 'error');
      }
    }
  
    filterAttendanceRecords(date, className) {
      return this.attendance.filter(record => 
        record.date === date && 
        (!className || record.className === className)
      );
    }
  
    filterStudents(className) {
      return className ? 
        this.students.filter(s => s.className === className) : 
        [...this.students];
    }
  
    displayEmptyState(container, percentageEl, countsEl) {
      container.innerHTML = '<div class="notification info">No students found</div>';
      percentageEl.textContent = '0%';
      countsEl.textContent = 'Present: 0 / Absent: 0 / Total: 0';
    }
  
    renderAttendanceList(students, attendanceRecords, container) {
      let presentCount = 0;
      
      container.innerHTML = students.map(student => {
        const isPresent = attendanceRecords.some(record => 
          record.name === student.name && record.present
        );
        
        if (isPresent) presentCount++;
        
        return this.createAttendanceCard(student, isPresent);
      }).join('');
      
      return presentCount;
    }
  
    createAttendanceCard(student, isPresent) {
      const date = this.dom.dateInput.value;
      return `
        <div class="attendance-card">
          <label>${student.name} <small>(${student.className})</small></label>
          <label class="switch">
            <input type="checkbox" 
                   id="${student.name}-${date}" 
                   ${isPresent ? 'checked' : ''}
                   data-student-id="${student.id || student.name}">
            <span class="slider round"></span>
          </label>
        </div>
      `;
    }
  
    updateStats(presentCount, totalStudents, percentageEl, countsEl) {
      const attendancePercentage = Math.round((presentCount / totalStudents) * 100);
      percentageEl.textContent = `${attendancePercentage}%`;
      countsEl.textContent = 
        `Present: ${presentCount} / Absent: ${totalStudents - presentCount} / Total: ${totalStudents}`;
    }
  
    saveAttendance() {
      const { dateInput, classSelect } = this.dom;
      const date = dateInput.value;
      const className = classSelect.value;
      
      if (!date) {
        showNotification('Please select a date first!', "error");
        return;
      }
  
      try {
        const filteredStudents = this.filterStudents(className);
        const records = this.createAttendanceRecords(date, className, filteredStudents);
        
        this.updateAttendanceStorage(date, className, records);
        
        showNotification('Attendance saved successfully!');
        logActivity(
          'Attendance recorded', 
          `Saved attendance for ${date}${className ? ` (${className})` : ''}`
        );
      } catch (error) {
        console.error('Error saving attendance:', error);
        showNotification('Failed to save attendance', 'error');
      }
    }
  
    createAttendanceRecords(date, className, students) {
      return students.map(student => ({
        name: student.name,
        className: student.className,
        date,
        present: document.getElementById(`${student.name}-${date}`)?.checked || false
      }));
    }
  
    updateAttendanceStorage(date, className, newRecords) {
      // Remove existing records for this date and class
      this.attendance = this.attendance.filter(record => 
        !(record.date === date && (!className || record.className === className))
      ).concat(newRecords);
      
      localStorage.setItem('attendance', JSON.stringify(this.attendance));
    }
  
    printAttendance() {
      const date = this.dom.dateInput.value;
      if (!date) {
        showNotification('Please select a date first!', "error");
        return;
      }
      
      // Implement actual print functionality here
      window.print();
    }
  
    clearAttendance() {
      showConfirmation(
        "Clear Attendance", 
        "Are you sure you want to clear all attendance records? This action cannot be undone.", 
        () => {
          this.attendance = [];
          localStorage.setItem('attendance', JSON.stringify(this.attendance));
          showNotification('Attendance records cleared!');
          this.loadAttendance();
          logActivity('Attendance cleared', 'All attendance records removed');
        }
      );
    }
  }
  
  // Initialize the manager when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    new AttendanceManager();
  });