// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    // Check if user is admin and show admin menu
    checkAdminMenu();

    // Load dashboard data
    loadDashboardData();

    // Setup event handlers
    setupEventHandlers();
});

// Check if user is admin and show admin menu
function checkAdminMenu() {
    const user = getCurrentUser();
    const adminEmails = [
        'admin@cnpgroup.co.kr',
        'iworks@cnpgroup.co.kr',
        'admin@cnp.co.kr',
        'snkim@cnpgroup.co.kr',
        'jmkim@cnpgroup.co.kr'
    ];
    
    const isAdmin = adminEmails.includes(user.email.toLowerCase()) || 
                    user.email.toLowerCase().includes('admin');
    
    if (isAdmin) {
        const adminMenuLink = document.getElementById('adminMenuLink');
        if (adminMenuLink) {
            adminMenuLink.style.display = 'block';
        }
    }
}

// Setup event handlers
function setupEventHandlers() {
    // Edit profile button
    const editProfileBtn = document.getElementById('editProfileBtn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            alert('프로필 수정 기능은 추후 추가될 예정입니다.');
        });
    }

    // Attendance modal
    const attendanceModal = document.getElementById('attendanceModal');
    const confirmAttendanceBtn = document.getElementById('confirmAttendanceBtn');
    
    if (confirmAttendanceBtn) {
        confirmAttendanceBtn.addEventListener('click', confirmAttendance);
    }
}

// Load dashboard data
async function loadDashboardData() {
    const user = getCurrentUser();
    
    // Update user info
    document.getElementById('userName').textContent = user.name + '님';
    document.getElementById('userEmail').textContent = user.email;
    
    const userTypeBadge = document.getElementById('userTypeBadge');
    if (user.user_type === 'company') {
        userTypeBadge.textContent = '기업 멤버쉽';
        userTypeBadge.classList.add('badge-company');
        
        // Load membership info
        await loadMembershipInfo(user.membership_id);
    } else {
        userTypeBadge.textContent = '개인 회원';
    }
    
    // Load courses
    await loadMyCourses(user.id);
    
    // Load attendance
    await loadAttendanceRecords(user.id);
}

// Load membership info
async function loadMembershipInfo(membershipId) {
    if (!membershipId) return;
    
    try {
        const membership = await apiRequest(`tables/memberships/${membershipId}`);
        
        const membershipInfo = document.getElementById('membershipInfo');
        membershipInfo.style.display = 'block';
        
        document.getElementById('companyName').textContent = membership.company_name;
        document.getElementById('seatsPurchased').textContent = membership.seats_purchased + '석';
        
        const startDate = new Date(membership.start_date);
        const endDate = new Date(membership.end_date);
        document.getElementById('membershipPeriod').textContent = 
            `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
        
        const statusElement = document.getElementById('membershipStatus');
        if (membership.status === 'active') {
            statusElement.textContent = '활성';
            statusElement.style.color = 'var(--success-color)';
        } else if (membership.status === 'expired') {
            statusElement.textContent = '만료';
            statusElement.style.color = 'var(--danger-color)';
        } else {
            statusElement.textContent = '정지';
            statusElement.style.color = 'var(--warning-color)';
        }
        
    } catch (error) {
        console.error('Error loading membership info:', error);
    }
}

// Load my courses
async function loadMyCourses(userId) {
    const container = document.getElementById('myCoursesContainer');
    
    try {
        // Get enrollments
        const enrollmentsResponse = await apiRequest('tables/enrollments?limit=1000');
        const enrollments = (enrollmentsResponse.data || []).filter(e => e.user_id === userId);
        
        if (enrollments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book-open" style="font-size: 3rem; color: var(--gray); margin-bottom: 1rem;"></i>
                    <p style="color: var(--gray);">등록된 과정이 없습니다.</p>
                    <a href="courses.html" class="btn btn-primary" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> 과정 둘러보기
                    </a>
                </div>
            `;
            return;
        }
        
        // Get courses
        const coursesResponse = await apiRequest('tables/courses?limit=100');
        const courses = coursesResponse.data || [];
        
        // Render courses
        let html = '';
        for (const enrollment of enrollments) {
            const course = courses.find(c => c.id === enrollment.course_id);
            if (!course) continue;
            
            html += `
                <div class="course-list-item">
                    <div class="course-list-info">
                        <h4>${course.title}</h4>
                        <p>${course.schedule}</p>
                        <span class="badge" style="background: var(--success-color);">${enrollment.status === 'enrolled' ? '수강중' : '완료'}</span>
                    </div>
                    <div class="course-list-actions">
                        <a href="payment.html" class="btn btn-secondary btn-outline-small">
                            <i class="fas fa-shopping-cart"></i> 장바구니
                        </a>
                        <button class="btn btn-primary btn-outline-small check-attendance-btn" 
                                data-enrollment-id="${enrollment.id}" 
                                data-course-id="${course.id}"
                                data-course-title="${course.title}">
                            <i class="fas fa-clipboard-check"></i> 출석체크
                        </button>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
        
        // Add event listeners for attendance check
        document.querySelectorAll('.check-attendance-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const enrollmentId = this.getAttribute('data-enrollment-id');
                const courseId = this.getAttribute('data-course-id');
                const courseTitle = this.getAttribute('data-course-title');
                openAttendanceModal(enrollmentId, courseId, courseTitle);
            });
        });
        
    } catch (error) {
        console.error('Error loading courses:', error);
        container.innerHTML = '<p style="color: var(--danger-color);">과정 정보를 불러오는 중 오류가 발생했습니다.</p>';
    }
}

// Load attendance records
async function loadAttendanceRecords(userId) {
    const container = document.getElementById('attendanceContainer');
    
    try {
        const attendanceResponse = await apiRequest('tables/attendance?limit=1000');
        const attendanceRecords = (attendanceResponse.data || []).filter(a => a.user_id === userId);
        
        if (attendanceRecords.length === 0) {
            container.innerHTML = '<p style="color: var(--gray); text-align: center;">출석 기록이 없습니다.</p>';
            return;
        }
        
        // Get courses for reference
        const coursesResponse = await apiRequest('tables/courses?limit=100');
        const courses = coursesResponse.data || [];
        
        // Sort by date (newest first)
        attendanceRecords.sort((a, b) => new Date(b.session_date) - new Date(a.session_date));
        
        // Render table
        let html = `
            <table class="attendance-table">
                <thead>
                    <tr>
                        <th>과정명</th>
                        <th>회차</th>
                        <th>날짜</th>
                        <th>출석여부</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        for (const record of attendanceRecords.slice(0, 20)) { // Show last 20 records
            const course = courses.find(c => c.id === record.course_id);
            const courseName = course ? course.title : '알 수 없음';
            
            html += `
                <tr>
                    <td>${courseName}</td>
                    <td>${record.session_number}회차</td>
                    <td>${formatDate(record.session_date)}</td>
                    <td>
                        <span class="attendance-status ${record.attended ? 'present' : 'absent'}">
                            <i class="fas fa-${record.attended ? 'check' : 'times'}"></i>
                            ${record.attended ? '출석' : '결석'}
                        </span>
                    </td>
                </tr>
            `;
        }
        
        html += `
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading attendance:', error);
        container.innerHTML = '<p style="color: var(--danger-color);">출석 기록을 불러오는 중 오류가 발생했습니다.</p>';
    }
}

// Open attendance modal
let currentEnrollmentId = null;
let currentCourseId = null;

function openAttendanceModal(enrollmentId, courseId, courseTitle) {
    currentEnrollmentId = enrollmentId;
    currentCourseId = courseId;
    
    document.getElementById('attendanceCourseName').textContent = courseTitle;
    
    // Get current session info (for demo, use current date)
    const now = new Date();
    document.getElementById('attendanceSessionInfo').textContent = 
        `${now.toLocaleDateString('ko-KR')} 수업`;
    document.getElementById('attendanceTime').textContent = 
        now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    
    openModal('attendanceModal');
}

// Confirm attendance
async function confirmAttendance() {
    const user = getCurrentUser();
    
    try {
        // Check if already checked in today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const attendanceResponse = await apiRequest('tables/attendance?limit=1000');
        const existingAttendance = (attendanceResponse.data || []).find(a => {
            const sessionDate = new Date(a.session_date);
            sessionDate.setHours(0, 0, 0, 0);
            return a.user_id === user.id && 
                   a.course_id === currentCourseId && 
                   sessionDate.getTime() === today.getTime();
        });
        
        if (existingAttendance) {
            alert('오늘 이미 출석 체크를 완료했습니다.');
            closeModal('attendanceModal');
            return;
        }
        
        // Get session number (count previous sessions)
        const previousSessions = (attendanceResponse.data || []).filter(a => 
            a.user_id === user.id && a.course_id === currentCourseId
        );
        const sessionNumber = previousSessions.length + 1;
        
        // Create attendance record
        const attendanceData = {
            enrollment_id: currentEnrollmentId,
            user_id: user.id,
            course_id: currentCourseId,
            session_date: new Date().toISOString(),
            session_number: sessionNumber,
            attended: true,
            check_in_time: new Date().toISOString()
        };
        
        await apiRequest('tables/attendance', {
            method: 'POST',
            body: JSON.stringify(attendanceData)
        });
        
        alert('출석 체크가 완료되었습니다!');
        closeModal('attendanceModal');
        
        // Reload attendance records
        loadAttendanceRecords(user.id);
        
    } catch (error) {
        console.error('Attendance check error:', error);
        alert('출석 체크 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}