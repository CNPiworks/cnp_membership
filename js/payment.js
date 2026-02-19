// Payment JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    // Load payment information
    loadPaymentInfo();

    // Setup event handlers
    setupEventHandlers();
});

// Setup event handlers
function setupEventHandlers() {
    const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', handlePaymentConfirmation);
    }
}

// Load payment information
async function loadPaymentInfo() {
    const user = getCurrentUser();
    const urlParams = new URLSearchParams(window.location.search);
    const enrollmentId = urlParams.get('enrollment');
    
    if (!enrollmentId) {
        document.getElementById('paymentInfo').innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <p>납부 정보를 찾을 수 없습니다.</p>
            </div>
        `;
        return;
    }

    try {
        // Get enrollment info
        const enrollment = await apiRequest(`tables/enrollments/${enrollmentId}`);
        
        // Get course info
        const course = await apiRequest(`tables/courses/${enrollment.course_id}`);
        
        // Get membership info if applicable
        let membershipInfo = '';
        if (enrollment.enrollment_type === 'membership' && enrollment.membership_id) {
            const membership = await apiRequest(`tables/memberships/${enrollment.membership_id}`);
            membershipInfo = `
                <div class="info-row">
                    <span class="label">멤버십:</span>
                    <span class="value">${membership.company_name}</span>
                </div>
            `;
        }
        
        // Display payment info
        const paymentAmount = enrollment.enrollment_type === 'membership' ? 1000000 : course.price;
        const paymentType = enrollment.enrollment_type === 'membership' ? '멤버십 (좌석당)' : '개별 수강';
        
        document.getElementById('paymentInfo').innerHTML = `
            <div class="payment-summary">
                <div class="info-row">
                    <span class="label">신청자:</span>
                    <span class="value">${user.name}</span>
                </div>
                <div class="info-row">
                    <span class="label">교육 과정:</span>
                    <span class="value">${course.title}</span>
                </div>
                <div class="info-row">
                    <span class="label">등록 유형:</span>
                    <span class="value">${paymentType}</span>
                </div>
                ${membershipInfo}
                <div class="info-row total">
                    <span class="label">납부 금액:</span>
                    <span class="value amount">${paymentAmount.toLocaleString('ko-KR')}원</span>
                </div>
                <div class="info-row">
                    <span class="label">신청일:</span>
                    <span class="value">${formatDate(enrollment.enrollment_date)}</span>
                </div>
            </div>
            
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                <p><strong>입금 시 반드시 수강생 이름(${user.name})을 입금자명으로 입력해 주세요.</strong></p>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading payment info:', error);
        document.getElementById('paymentInfo').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i>
                <p>납부 정보를 불러오는 중 오류가 발생했습니다.</p>
            </div>
        `;
    }
}

// Copy account number to clipboard
function copyAccountNumber() {
    const accountNumber = '1005-123-456789';
    navigator.clipboard.writeText(accountNumber).then(() => {
        alert('계좌번호가 복사되었습니다.');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('복사에 실패했습니다. 수동으로 복사해 주세요.');
    });
}

// Request tax invoice
function requestTaxInvoice() {
    const businessNumber = document.getElementById('businessNumber').value;
    const companyName = document.getElementById('companyName').value;
    const ceoName = document.getElementById('ceoName').value;
    const businessAddress = document.getElementById('businessAddress').value;
    const businessType = document.getElementById('businessType').value;
    const businessItem = document.getElementById('businessItem').value;
    const invoiceEmail = document.getElementById('invoiceEmail').value;
    
    // Validation
    if (!businessNumber || !companyName || !ceoName || !businessAddress || !invoiceEmail) {
        alert('필수 항목을 모두 입력해 주세요.');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(invoiceEmail)) {
        alert('올바른 이메일 주소를 입력해 주세요.');
        return;
    }
    
    // In a real application, this would send the data to the server
    const invoiceData = {
        businessNumber,
        companyName,
        ceoName,
        businessAddress,
        businessType,
        businessItem,
        invoiceEmail,
        requestDate: new Date().toISOString(),
        userId: getCurrentUser().id
    };
    
    console.log('Tax invoice request:', invoiceData);
    
    alert('세금계산서 발급 요청이 접수되었습니다.\n입금 확인 후 1~2일 이내에 이메일로 발송됩니다.\n\n문의: iworks@cnpgroup.co.kr');
    
    // Clear form
    document.getElementById('businessNumber').value = '';
    document.getElementById('companyName').value = '';
    document.getElementById('ceoName').value = '';
    document.getElementById('businessAddress').value = '';
    document.getElementById('businessType').value = '';
    document.getElementById('businessItem').value = '';
    document.getElementById('invoiceEmail').value = '';
}

// Confirm payment
function confirmPayment() {
    openModal('confirmModal');
}

// Handle payment confirmation
function handlePaymentConfirmation() {
    const urlParams = new URLSearchParams(window.location.search);
    const enrollmentId = urlParams.get('enrollment');
    
    if (!enrollmentId) {
        alert('수강 신청 정보를 찾을 수 없습니다.');
        return;
    }
    
    // In a real application, this would update the payment status in the database
    alert('입금 확인 요청이 접수되었습니다.\n담당자 확인 후 수강 상태가 업데이트됩니다.\n\n확인 소요 시간: 영업일 기준 1~2일');
    
    closeModal('confirmModal');
    
    // Redirect to dashboard after a short delay
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 2000);
}