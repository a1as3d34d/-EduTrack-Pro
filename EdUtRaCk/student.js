class StudentManager {
    constructor() {
      this.students = JSON.parse(localStorage.getItem('students')) || [];
      this.attendance = JSON.parse(localStorage.getItem('attendance')) || [];
      this.currentSubject = null;
      this.currentStudentIndex = null;
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
  
      this.initEventListeners();
    }
  
    initEventListeners() {
      // Class selection change
      document.getElementById('class')?.addEventListener('change', () => this.populateSubjects());
      
      // Search form submission
      document.getElementById('searchForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.searchStudent();
      });
      
      // Advanced search form submission
      document.getElementById('advancedSearchForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        this.performAdvancedSearch();
      });
      
      // Group filter change
      document.getElementById('groupFilter')?.addEventListener('change', () => this.filterByGroup());
      
      // Sort selection change
      document.getElementById('sortBy')?.addEventListener('change', () => this.sortStudents());
    }
  
    // ======================
    // SUBJECT MANAGEMENT
    // ======================
  
    populateSubjects() {
      const classSelection = document.getElementById("class").value;
      const subjectsContainer = document.getElementById("subjectsContainer");
      subjectsContainer.innerHTML = "";
  
      if (classSelection && this.subjectsByClass[classSelection]) {
        this.subjectsByClass[classSelection].forEach(subject => {
          const subjectCard = document.createElement("div");
          subjectCard.className = "subject-card";
          subjectCard.innerHTML = `
            <div class="subject-selector">
              <input type="checkbox" id="${subject}" class="subject-checkbox">
              <label for="${subject}">${subject}</label>
            </div>
            <button class="grade-btn" onclick="studentManager.openGradeModal('${subject}')">
              <i class="fas fa-edit"></i> Add Grade
            </button>
          `;
          subjectsContainer.appendChild(subjectCard);
        });
      }
    }
  
    openGradeModal(subject) {
      this.currentSubject = subject;
      document.getElementById("modalSubjectName").textContent = subject;
      document.getElementById("gradeInput").value = "";
      document.getElementById("scoreInput").value = "";
      document.getElementById("teacherNotes").value = "";
      this.openModal('gradeModal');
    }
  
    saveGrade() {
      const grade = document.getElementById("gradeInput").value.toUpperCase();
      const score = document.getElementById("scoreInput").value;
      const notes = document.getElementById("teacherNotes").value.trim();
      const validGrades = ['A', 'B', 'C', 'D', 'E', 'F'];
      
      if (!grade || !validGrades.includes(grade)) {
        this.showNotification("Please select a valid grade!", "error");
        return;
      }
      
      if (score && (score < 0 || score > 100)) {
        this.showNotification("Score must be between 0-100!", "error");
        return;
      }
      
      const subjectCard = document.querySelector(`#subjectsContainer input[id="${this.currentSubject}"]`).parentElement.parentElement;
      subjectCard.classList.add("graded");
      
      const gradeBtn = subjectCard.querySelector(".grade-btn");
      gradeBtn.innerHTML = `<i class="fas fa-check"></i> Grade: ${grade}`;
      gradeBtn.dataset.grade = grade;
      gradeBtn.dataset.score = score || '';
      gradeBtn.dataset.notes = notes;
      
      if (notes) {
        let notesIndicator = subjectCard.querySelector('.grade-notes');
        if (!notesIndicator) {
          notesIndicator = document.createElement('div');
          notesIndicator.className = 'grade-notes';
          subjectCard.appendChild(notesIndicator);
        }
        notesIndicator.textContent = notes.length > 50 ? notes.substring(0, 47) + '...' : notes;
        notesIndicator.title = notes;
      }
      
      this.closeModal('gradeModal');
    }
  
    // ======================
    // STUDENT CRUD OPERATIONS
    // ======================
  
    addStudent() {
      const formData = this.getStudentFormData();
      if (!this.validateStudentForm(formData)) return;
  
      const newStudent = { 
        ...formData,
        registrationDate: new Date().toISOString()
      };
  
      this.students.push(newStudent);
      this.saveStudents();
      
      this.logActivity('New student added', `Registered ${formData.name} in ${formData.className} program`);
      this.showNotification('Student added successfully!');
      this.clearForm();
      this.updateDashboard();
    }
  
    editStudent(index) {
      this.currentStudentIndex = index;
      const student = this.students[index];
      
      document.getElementById('name').value = student.name;
      document.getElementById('age').value = student.age;
      document.getElementById('email').value = student.email || '';
      document.getElementById('phone').value = student.phone || '';
      document.getElementById('class').value = student.className;
      this.populateSubjects();
  
      setTimeout(() => {
        const subjectsContainer = document.getElementById('subjectsContainer');
        subjectsContainer.querySelectorAll('.subject-card').forEach(card => {
          const subject = card.querySelector('input').id;
          if (student.subjects[subject]) {
            card.querySelector('input').checked = true;
            const gradeBtn = card.querySelector('.grade-btn');
            gradeBtn.innerHTML = `<i class="fas fa-check"></i> Grade: ${student.subjects[subject].grade || ''}`;
            gradeBtn.dataset.grade = student.subjects[subject].grade || '';
            gradeBtn.dataset.score = student.subjects[subject].score || '';
            gradeBtn.dataset.notes = student.subjects[subject].notes || '';
            card.classList.add("graded");
            
            if (student.subjects[subject].notes) {
              let notesIndicator = card.querySelector('.grade-notes');
              if (!notesIndicator) {
                notesIndicator = document.createElement('div');
                notesIndicator.className = 'grade-notes';
                card.appendChild(notesIndicator);
              }
              notesIndicator.textContent = student.subjects[subject].notes.length > 50 ? 
                student.subjects[subject].notes.substring(0, 47) + '...' : 
                student.subjects[subject].notes;
              notesIndicator.title = student.subjects[subject].notes;
            }
          }
        });
        
        const addButton = document.querySelector('#add button');
        addButton.innerHTML = '<i class="fas fa-save"></i> Save Changes';
        addButton.onclick = () => this.saveStudentChanges();
      }, 100);
    }
  
    saveStudentChanges() {
      const formData = this.getStudentFormData();
      if (!this.validateStudentForm(formData)) return;
  
      this.students[this.currentStudentIndex] = { 
        ...this.students[this.currentStudentIndex],
        ...formData
      };
      
      this.saveStudents();
      this.showNotification('Student updated successfully!');
      this.clearForm();
      this.viewAllStudents();
      this.updateDashboard();
      
      this.logActivity('Student updated', `Modified details for ${formData.name}`);
      
      const addButton = document.querySelector('#add button');
      addButton.innerHTML = '<i class="fas fa-save"></i> Register Student';
      addButton.onclick = () => this.addStudent();
    }
  
    deleteStudent(index) {
      const studentName = this.students[index].name;
      this.students.splice(index, 1);
      this.saveStudents();
      this.showNotification('Student deleted successfully!');
      this.viewAllStudents();
      this.updateDashboard();
      this.logActivity('Student deleted', `Removed ${studentName} from records`);
    }
  
    // ======================
    // STUDENT SEARCH & FILTERING
    // ======================
  
    searchStudent() {
      const name = document.getElementById('searchName').value.toLowerCase().trim();
      const className = document.getElementById('searchClass').value;
      const resultDiv = document.getElementById('searchResult');
      resultDiv.innerHTML = "";
  
      if (!name && !className) {
        resultDiv.innerHTML = `<div class="notification warning">Please enter search criteria</div>`;
        return;
      }
  
      const found = this.students.filter(student => {
        const nameMatch = name ? student.name.toLowerCase().includes(name) : true;
        const classMatch = className ? student.className === className : true;
        return nameMatch && classMatch;
      });
  
      this.displaySearchResults(found, resultDiv);
    }
  
    performAdvancedSearch() {
      const name = document.getElementById('advName').value.trim().toLowerCase();
      const className = document.getElementById('advClass').value;
      const ageMin = parseInt(document.getElementById('advAgeMin').value) || 5;
      const ageMax = parseInt(document.getElementById('advAgeMax').value) || 30;
      const subject = document.getElementById('advSubject').value;
      const grade = document.getElementById('advGrade').value;
      
      const resultDiv = document.getElementById('searchResult');
      resultDiv.innerHTML = "";
      
      const found = this.students.filter(student => {
        const nameMatch = name ? student.name.toLowerCase().includes(name) : true;
        const classMatch = className ? student.className === className : true;
        const ageMatch = student.age >= ageMin && student.age <= ageMax;
        let subjectMatch = true;
        
        if (subject) {
          subjectMatch = student.subjects.hasOwnProperty(subject);
          if (subjectMatch && grade) {
            subjectMatch = student.subjects[subject].grade === grade;
          }
        }
        
        return nameMatch && classMatch && ageMatch && subjectMatch;
      });
      
      this.displaySearchResults(found, resultDiv);
      this.closeModal('advancedSearchModal');
    }
  
    filterByGroup() {
      const group = document.getElementById('groupFilter').value;
      const allStudentsDiv = document.getElementById('allStudents');
      
      if (!group) {
        this.viewAllStudents();
        return;
      }
  
      const filtered = this.students.filter(student => student.className === group);
      this.displayStudentList(filtered, allStudentsDiv);
    }
  
    sortStudents() {
      const sortBy = document.getElementById('sortBy').value;
      const [field, direction] = sortBy.split('-');
      
      this.students.sort((a, b) => {
        let comparison = 0;
        
        if (field === 'name') {
          comparison = a.name.localeCompare(b.name);
        } else if (field === 'age') {
          comparison = a.age - b.age;
        } else if (field === 'class') {
          comparison = a.className.localeCompare(b.className);
        }
        
        return direction === 'desc' ? -comparison : comparison;
      });
      
      this.viewAllStudents();
    }
  
    // ======================
    // STUDENT DISPLAY FUNCTIONS
    // ======================
  
    viewAllStudents() {
      const allStudentsDiv = document.getElementById('allStudents');
      this.displayStudentList(this.students, allStudentsDiv);
    }
  
    viewStudentDetails(studentName) {
      const student = this.students.find(s => s.name === studentName);
      if (!student) return;
      
      const modalContent = document.getElementById('studentModalContent');
      modalContent.innerHTML = this.generateStudentDetailsHTML(student);
      
      this.loadStudentAttendanceChart(student.name);
      this.openModal('studentModal');
    }
  
    // ======================
    // HELPER FUNCTIONS
    // ======================
  
    getStudentFormData() {
      const name = document.getElementById('name').value.trim();
      const age = document.getElementById('age').value;
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const className = document.getElementById('class').value;
      const photoFile = document.getElementById('photo').files[0];
      const subjects = {};
  
      document.querySelectorAll('.subject-card').forEach(card => {
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (checkbox.checked) {
          const subject = checkbox.id;
          const gradeBtn = card.querySelector('.grade-btn');
          const grade = gradeBtn.dataset.grade || '';
          const score = gradeBtn.dataset.score || '';
          const notes = gradeBtn.dataset.notes || '';
          subjects[subject] = { grade, score, notes };
        }
      });
  
      // Handle photo upload
      let photoUrl = this.currentStudentIndex !== null ? 
        this.students[this.currentStudentIndex].photoUrl || '' : '';
      if (photoFile) {
        if (photoUrl) URL.revokeObjectURL(photoUrl);
        photoUrl = URL.createObjectURL(photoFile);
      }
  
      return { name, age, email, phone, className, photoUrl, subjects };
    }
  
    validateStudentForm(formData) {
      if (!formData.name) {
        this.showNotification('Please enter a valid name!', "error");
        return false;
      }
  
      if (!formData.age || formData.age < 5 || formData.age > 30) {
        this.showNotification('Please enter a valid age between 5 and 30!', "error");
        return false;
      }
  
      if (formData.email && !this.validateEmail(formData.email)) {
        this.showNotification('Please enter a valid email address!', "error");
        return false;
      }
  
      if (!formData.className) {
        this.showNotification('Please select a program!', "error");
        return false;
      }
  
      if (Object.keys(formData.subjects).length === 0) {
        this.showNotification('Please select at least one subject!', "error");
        return false;
      }
  
      return true;
    }
  
    validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    }
  
    clearForm() {
      document.getElementById('name').value = '';
      document.getElementById('age').value = '';
      document.getElementById('email').value = '';
      document.getElementById('phone').value = '';
      document.getElementById('class').value = '';
      document.getElementById('photo').value = '';
      document.getElementById('subjectsContainer').innerHTML = '';
    }
  
    saveStudents() {
      localStorage.setItem('students', JSON.stringify(this.students));
    }
  
    displaySearchResults(students, container) {
      if (students.length > 0) {
        container.innerHTML = students.map(student => this.generateStudentCardHTML(student)).join('');
      } else {
        container.innerHTML = `<div class="notification info">No students found matching your criteria</div>`;
      }
    }
  
    displayStudentList(students, container) {
      if (students.length === 0) {
        container.innerHTML = `<div class="notification info">No students found</div>`;
        return;
      }
  
      container.innerHTML = students.map((student, index) => `
        <div class="student-card">
          ${student.photoUrl ? `<img src="${student.photoUrl}" alt="${student.name}" class="student-photo">` : ''}
          <div><strong>Name:</strong> ${student.name}</div>
          <div><strong>Age:</strong> ${student.age}</div>
          <div><strong>Program:</strong> ${student.className}</div>
          <div><strong>Subjects:</strong> ${Object.keys(student.subjects).length}</div>
          <div><strong>Registered:</strong> ${this.formatDateTime(student.registrationDate)}</div>
          <div class="student-actions">
            <button onclick="studentManager.viewStudentDetails('${student.name}')">
              <i class="fas fa-eye"></i> View
            </button>
            <button onclick="studentManager.editStudent(${index})">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button onclick="studentManager.deleteStudentPrompt(${index})" class="danger">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      `).join('');
    }
  
    generateStudentCardHTML(student) {
      return `
        <div class="student-card">
          ${student.photoUrl ? `<img src="${student.photoUrl}" alt="${student.name}" class="student-photo">` : ''}
          <div><strong>Name:</strong> ${student.name}</div>
          <div><strong>Age:</strong> ${student.age}</div>
          <div><strong>Program:</strong> ${student.className}</div>
          ${student.email ? `<div><strong>Email:</strong> ${student.email}</div>` : ''}
          ${student.phone ? `<div><strong>Phone:</strong> ${student.phone}</div>` : ''}
          <div><strong>Subjects:</strong> 
            <ul class="subject-list">
              ${Object.entries(student.subjects).map(([sub, data]) => `
                <li>
                  ${sub} (${data.grade || 'No grade'})
                  ${data.score ? `<span class="grade-score">${data.score}%</span>` : ''}
                  ${data.notes ? `<div class="grade-notes">${data.notes}</div>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
          <button onclick="studentManager.viewStudentDetails('${student.name}')">
            <i class="fas fa-eye"></i> View Details
          </button>
        </div>
      `;
    }
  
    generateStudentDetailsHTML(student) {
      return `
        <h3>${student.name} <small>(${student.className})</small></h3>
        ${student.photoUrl ? `<img src="${student.photoUrl}" alt="${student.name}" class="student-detail-photo">` : ''}
        
        <div class="student-info">
          <div><strong>Age:</strong> ${student.age}</div>
          ${student.email ? `<div><strong>Email:</strong> ${student.email}</div>` : ''}
          ${student.phone ? `<div><strong>Phone:</strong> ${student.phone}</div>` : ''}
          <div><strong>Registered:</strong> ${this.formatDateTime(student.registrationDate)}</div>
        </div>
        
        <h4><i class="fas fa-book"></i> Subjects</h4>
        <div class="subject-performance">
          ${Object.entries(student.subjects).map(([sub, data]) => `
            <div class="subject-grade">
              <div><strong>${sub}:</strong> ${data.grade || 'No grade'} ${data.score ? `(${data.score}%)` : ''}</div>
              ${data.notes ? `<div class="grade-notes">${data.notes}</div>` : ''}
            </div>
          `).join('')}
        </div>
        
        <h4><i class="fas fa-calendar-check"></i> Attendance</h4>
        <div id="studentAttendanceChart" class="attendance-chart"></div>
        
        <div class="student-detail-actions">
          <button onclick="studentManager.editStudentByName('${student.name}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button onclick="studentManager.deleteStudentByName('${student.name}')" class="danger">
            <i class="fas fa-trash"></i> Delete
          </button>
          <button onclick="studentManager.printStudentReport('${student.name}')" class="secondary">
            <i class="fas fa-print"></i> Print Report
          </button>
        </div>
      `;
    }
  
    loadStudentAttendanceChart(studentName) {
      const studentAttendance = this.attendance.filter(a => a.name === studentName);
      const presentCount = studentAttendance.filter(a => a.present).length;
      const absentCount = studentAttendance.filter(a => !a.present).length;
      
      const ctx = document.createElement('canvas');
      document.getElementById('studentAttendanceChart').innerHTML = '';
      document.getElementById('studentAttendanceChart').appendChild(ctx);
      
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Present', 'Absent'],
          datasets: [{
            data: [presentCount, absentCount],
            backgroundColor: ['rgba(40, 167, 69, 0.7)', 'rgba(220, 53, 69, 0.7)'],
            borderColor: ['rgba(40, 167, 69, 1)', 'rgba(220, 53, 69, 1)'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  
    // ======================
    // UTILITY FUNCTIONS
    // ======================
  
    formatDateTime(timestamp) {
      return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  
    calculateStudentGPA(student) {
      let totalPoints = 0;
      let totalSubjects = 0;
      
      for (const [subject, data] of Object.entries(student.subjects)) {
        if (data.grade && this.gradeScale[data.grade]) {
          totalPoints += this.gradeScale[data.grade].points;
          totalSubjects++;
        }
      }
      
      return totalSubjects > 0 ? totalPoints / totalSubjects : null;
    }
  
    deleteStudentPrompt(index) {
      const studentName = this.students[index].name;
      this.showConfirmation(
        "Delete Student", 
        `Are you sure you want to delete ${studentName}? This action cannot be undone.`, 
        () => this.deleteStudent(index)
      );
    }
  
    deleteStudentByName(studentName) {
      const index = this.students.findIndex(s => s.name === studentName);
      if (index !== -1) {
        this.deleteStudentPrompt(index);
        this.closeModal('studentModal');
      }
    }
  
    editStudentByName(studentName) {
      const index = this.students.findIndex(s => s.name === studentName);
      if (index !== -1) {
        this.editStudent(index);
        this.closeModal('studentModal');
      }
    }
  
    printStudentReport(studentName) {
      // This would be implemented with a print-specific stylesheet
      // and potentially generating a PDF or printable HTML page
      this.showNotification('Print feature coming soon!', 'info');
    }
  
    // ======================
    // UI HELPERS
    // ======================
  
    openModal(modalId) {
      document.getElementById(modalId).style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  
    closeModal(modalId) {
      document.getElementById(modalId).style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  
    showNotification(message, type = 'success') {
      // Your existing notification implementation
      console.log(`[${type}] ${message}`);
    }
  
    showConfirmation(title, message, action) {
      document.getElementById('confirmTitle').innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${title}`;
      document.getElementById('confirmMessage').textContent = message;
      this.pendingAction = action;
      this.openModal('confirmModal');
    }
  
    logActivity(action, details = '') {
      // Your existing activity logging implementation
      console.log(`[Activity] ${action}: ${details}`);
    }
  
    updateDashboard() {
      // Your existing dashboard update implementation
    }
  }
  
  // Initialize student manager
  const studentManager = new StudentManager();