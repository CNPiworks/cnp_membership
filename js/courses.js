// Courses page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Enroll button handlers
    const enrollButtons = document.querySelectorAll('.enroll-btn');
    enrollButtons.forEach(btn => {
        btn.addEventListener('click', handleEnrollClick);
    });

    // Modal handlers
    const modal = document.getElementById('enrollModal');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalConfirmBtn = document.getElementById('modalConfirmBtn');
    
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', () => {
            closeModal('enrollModal');
        });
    }
    
    if (modalConfirmBtn) {
        modalConfirmBtn.addEventListener('click', handleModalConfirm);
    }
});

let selectedCourseId = null;

// Handle enroll button click
function handleEnrollClick(e) {
    const courseId = this.getAttribute('data-course');
    selectedCourseId = courseId;
    
    if (!isLoggedIn()) {
        // Show login required modal
        document.getElementById('modalTitle').textContent = '로그인 필요';
        document.getElementById('modalMessage').textContent = '수강 신청을 진행하시려면 로그인이 필요합니다.';
        document.getElementById('modalConfirmBtn').textContent = '로그인하기';
        openModal('enrollModal');
    } else {
        // Proceed with enrollment
        enrollInCourse(courseId);
    }
}

// Handle modal confirm
function handleModalConfirm() {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
    } else {
        closeModal('enrollModal');
        if (selectedCourseId) {
            enrollInCourse(selectedCourseId);
        }
    }
}

// Enroll in course
async function enrollInCourse(courseId) {
    const user = getCurrentUser();
    
    try {
        // Check if already enrolled
        const enrollmentsResponse = await apiRequest(`tables/enrollments?limit=1000`);
        const enrollments = enrollmentsResponse.data || [];
        const alreadyEnrolled = enrollments.some(e => 
            e.user_id === user.id && e.course_id === courseId
        );
        
        if (alreadyEnrolled) {
            document.getElementById('modalTitle').textContent = '이미 등록됨';
            document.getElementById('modalMessage').textContent = '이미 이 과정에 등록되어 있습니다.';
            document.getElementById('modalConfirmBtn').textContent = '확인';
            openModal('enrollModal');
            return;
        }
        
        // Create enrollment
        const enrollmentData = {
            user_id: user.id,
            course_id: courseId,
            enrollment_type: user.user_type === 'company' ? 'membership' : 'individual',
            membership_id: user.membership_id || '',
            enrollment_date: new Date().toISOString(),
            status: 'enrolled'
        };
        
        const response = await apiRequest('tables/enrollments', {
            method: 'POST',
            body: JSON.stringify(enrollmentData)
        });
        
        document.getElementById('modalTitle').textContent = '수강 신청 완료';
        document.getElementById('modalMessage').textContent = '수강 신청이 완료되었습니다! 장바구니에서 비용 납부를 진행해 주세요.';
        document.getElementById('modalConfirmBtn').textContent = '장바구니 가기';
        document.getElementById('modalConfirmBtn').onclick = function() {
            window.location.href = 'payment.html';
        };
        openModal('enrollModal');
        
    } catch (error) {
        console.error('Enrollment error:', error);
        document.getElementById('modalTitle').textContent = '오류 발생';
        document.getElementById('modalMessage').textContent = '수강 신청 중 오류가 발생했습니다. 다시 시도해주세요.';
        document.getElementById('modalConfirmBtn').textContent = '확인';
        openModal('enrollModal');
    }
}