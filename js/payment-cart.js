// Payment Cart JavaScript
let allEnrollments = [];
let selectedEnrollments = [];
let selectedPaymentMethod = '';
let uploadedFile = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    // Load cart items
    loadCartItems();

    // Setup file upload drag and drop
    setupFileUpload();

    // Setup receipt type change
    const receiptType = document.getElementById('receiptType');
    if (receiptType) {
        receiptType.addEventListener('change', updateReceiptLabel);
    }
});

// Load cart items (unpaid enrollments)
async function loadCartItems() {
    const user = getCurrentUser();
    const container = document.getElementById('cartItemsContainer');

    try {
        // Get user's enrollments
        const enrollmentsResponse = await apiRequest('tables/enrollments?limit=1000');
        const allEnrolls = enrollmentsResponse.data || [];
        
        // Filter unpaid enrollments for current user
        const userEnrollments = allEnrolls.filter(e => 
            e.user_id === user.id && e.status === 'enrolled'
        );

        if (userEnrollments.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>수강 신청한 과정이 없습니다</h3>
                    <p style="margin: 1rem 0;">교육 과정을 먼저 신청해 주세요.</p>
                    <a href="courses.html" class="btn btn-primary">
                        <i class="fas fa-book"></i> 교육과정 보기
                    </a>
                </div>
            `;
            return;
        }

        // Get courses
        const coursesResponse = await apiRequest('tables/courses?limit=100');
        const courses = coursesResponse.data || [];

        // Match enrollments with courses
        allEnrollments = userEnrollments.map(enrollment => {
            const course = courses.find(c => c.id === enrollment.course_id);
            return {
                ...enrollment,
                course: course
            };
        }).filter(e => e.course); // Only keep enrollments with valid courses

        // Render cart items
        renderCartItems();

        // Update depositor name
        document.getElementById('depositorName').textContent = user.name;

    } catch (error) {
        console.error('Error loading cart items:', error);
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>데이터를 불러올 수 없습니다</h3>
                <p style="margin: 1rem 0;">잠시 후 다시 시도해 주세요.</p>
            </div>
        `;
    }
}

// Render cart items
function renderCartItems() {
    const container = document.getElementById('cartItemsContainer');
    
    container.innerHTML = allEnrollments.map((item, index) => {
        const course = item.course;
        const price = parseInt(course.price) || 0;
        
        return `
            <div class="cart-item">
                <div class="cart-item-checkbox">
                    <input type="checkbox" 
                           id="course-${index}" 
                           value="${item.id}"
                           onchange="toggleCourseSelection(${index})">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-title">${course.title}</div>
                    <div class="cart-item-meta">
                        <span><i class="fas fa-calendar"></i> ${course.duration}</span>
                        <span><i class="fas fa-clock"></i> ${course.schedule}</span>
                        ${item.enrollment_type === 'membership' ? 
                            '<span class="badge" style="background: #dcfce7; color: #166534;">멤버십</span>' : 
                            ''
                        }
                    </div>
                </div>
                <div class="cart-item-price">
                    ${item.enrollment_type === 'membership' ? 
                        '<span style="color: #10b981;">멤버십 포함</span>' : 
                        price.toLocaleString('ko-KR') + '원'
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Toggle course selection
function toggleCourseSelection(index) {
    const checkbox = document.getElementById(`course-${index}`);
    const enrollmentId = checkbox.value;
    
    if (checkbox.checked) {
        selectedEnrollments.push(allEnrollments[index]);
    } else {
        selectedEnrollments = selectedEnrollments.filter(e => e.id !== enrollmentId);
    }
    
    updateSummary();
}

// Select all courses
function selectAllCourses() {
    const selectAll = document.getElementById('selectAllCheckbox');
    const checkboxes = document.querySelectorAll('.cart-item-checkbox input[type="checkbox"]');
    
    checkboxes.forEach((checkbox, index) => {
        checkbox.checked = selectAll.checked;
    });
    
    if (selectAll.checked) {
        selectedEnrollments = [...allEnrollments];
    } else {
        selectedEnrollments = [];
    }
    
    updateSummary();
}

// Update summary
function updateSummary() {
    const selectedCount = selectedEnrollments.length;
    let totalAmount = 0;
    
    selectedEnrollments.forEach(item => {
        if (item.enrollment_type !== 'membership') {
            totalAmount += parseInt(item.course.price) || 0;
        }
    });
    
    document.getElementById('selectedCount').textContent = `${selectedCount}개`;
    document.getElementById('subtotal').textContent = totalAmount.toLocaleString('ko-KR') + '원';
    document.getElementById('totalAmount').textContent = totalAmount.toLocaleString('ko-KR') + '원';
}

// Proceed to payment
function proceedToPayment() {
    if (selectedEnrollments.length === 0) {
        alert('결제할 과정을 선택해 주세요.');
        return;
    }
    
    // Scroll to payment section
    document.getElementById('paymentSection').style.display = 'block';
    document.getElementById('paymentSection').scrollIntoView({ behavior: 'smooth' });
}

// Select payment method
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    
    // Update active state
    document.querySelectorAll('.payment-method').forEach(el => {
        el.classList.remove('active');
    });
    event.target.closest('.payment-method').classList.add('active');
    
    // Show corresponding details
    document.querySelectorAll('.payment-details').forEach(el => {
        el.classList.remove('active');
    });
    
    if (method === 'bank') {
        document.getElementById('bankDetails').classList.add('active');
    } else if (method === 'tax') {
        document.getElementById('taxDetails').classList.add('active');
    } else if (method === 'receipt') {
        document.getElementById('receiptDetails').classList.add('active');
    }
}

// Copy account number
function copyAccountNumber() {
    const accountNumber = '1005-123-456789';
    navigator.clipboard.writeText(accountNumber).then(() => {
        alert('계좌번호가 복사되었습니다.');
    });
}

// Setup file upload
function setupFileUpload() {
    const uploadArea = document.getElementById('fileUploadArea');
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file) {
            validateAndSetFile(file);
        }
    });
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        validateAndSetFile(file);
    }
}

// Validate and set file
function validateAndSetFile(file) {
    // Check file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        alert('JPG, PNG, PDF 파일만 업로드 가능합니다.');
        return;
    }
    
    uploadedFile = file;
    displayUploadedFile(file);
}

// Display uploaded file
function displayUploadedFile(file) {
    const container = document.getElementById('uploadedFileInfo');
    container.innerHTML = `
        <div class="uploaded-file">
            <i class="fas fa-check-circle"></i>
            <span>${file.name}</span>
            <span style="color: #6b7280;">(${(file.size / 1024).toFixed(1)} KB)</span>
            <i class="fas fa-times remove-file" onclick="removeFile()"></i>
        </div>
    `;
}

// Remove file
function removeFile() {
    uploadedFile = null;
    document.getElementById('businessLicenseFile').value = '';
    document.getElementById('uploadedFileInfo').innerHTML = '';
}

// Update receipt label
function updateReceiptLabel() {
    const receiptType = document.getElementById('receiptType').value;
    const label = document.getElementById('receiptNumberLabel');
    const input = document.getElementById('receiptNumber');
    
    if (receiptType === 'phone') {
        label.innerHTML = '휴대폰번호 <span class="required">*</span>';
        input.placeholder = '01012345678';
    } else if (receiptType === 'card') {
        label.innerHTML = '현금영수증카드번호 <span class="required">*</span>';
        input.placeholder = '카드번호 입력';
    } else if (receiptType === 'ssn') {
        label.innerHTML = '주민등록번호 <span class="required">*</span>';
        input.placeholder = '주민등록번호 입력 (- 제외)';
    }
}

// Submit payment
async function submitPayment() {
    if (selectedEnrollments.length === 0) {
        alert('결제할 과정을 선택해 주세요.');
        return;
    }
    
    if (!selectedPaymentMethod) {
        alert('결제 수단을 선택해 주세요.');
        return;
    }
    
    // Validate forms based on payment method
    if (selectedPaymentMethod === 'tax') {
        if (!validateTaxInvoiceForm()) {
            return;
        }
    } else if (selectedPaymentMethod === 'receipt') {
        if (!validateCashReceiptForm()) {
            return;
        }
    }
    
    try {
        const user = getCurrentUser();
        
        // Create payment record (you would need to create a payments table)
        const paymentData = {
            user_id: user.id,
            enrollment_ids: selectedEnrollments.map(e => e.id).join(','),
            payment_method: selectedPaymentMethod,
            total_amount: calculateTotalAmount(),
            status: 'pending',
            payment_date: new Date().toISOString(),
            payment_info: JSON.stringify(getPaymentInfo())
        };
        
        // Here you would save the payment record to database
        console.log('Payment data:', paymentData);
        
        // Show success message
        alert('입금 확인 요청이 접수되었습니다.\n담당자 확인 후 1-2영업일 내 처리됩니다.\n\n문의: iworks@cnpgroup.co.kr / 02-549-3744');
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Payment submission error:', error);
        alert('결제 요청 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
}

// Validate tax invoice form
function validateTaxInvoiceForm() {
    const businessNumber = document.getElementById('businessNumber').value;
    const companyName = document.getElementById('companyName').value;
    const ceoName = document.getElementById('ceoName').value;
    const businessAddress = document.getElementById('businessAddress').value;
    const businessType = document.getElementById('businessType').value;
    const businessItem = document.getElementById('businessItem').value;
    const taxEmail = document.getElementById('taxEmail').value;
    
    if (!businessNumber || !companyName || !ceoName || !businessAddress || 
        !businessType || !businessItem || !taxEmail) {
        alert('모든 필수 항목을 입력해 주세요.');
        return false;
    }
    
    if (!uploadedFile) {
        alert('사업자등록증을 업로드해 주세요.');
        return false;
    }
    
    return true;
}

// Validate cash receipt form
function validateCashReceiptForm() {
    const receiptType = document.getElementById('receiptType').value;
    const receiptNumber = document.getElementById('receiptNumber').value;
    
    if (!receiptType || !receiptNumber) {
        alert('모든 필수 항목을 입력해 주세요.');
        return false;
    }
    
    return true;
}

// Calculate total amount
function calculateTotalAmount() {
    let total = 0;
    selectedEnrollments.forEach(item => {
        if (item.enrollment_type !== 'membership') {
            total += parseInt(item.course.price) || 0;
        }
    });
    return total;
}

// Get payment info
function getPaymentInfo() {
    const info = {
        method: selectedPaymentMethod
    };
    
    if (selectedPaymentMethod === 'tax') {
        info.businessNumber = document.getElementById('businessNumber').value;
        info.companyName = document.getElementById('companyName').value;
        info.ceoName = document.getElementById('ceoName').value;
        info.businessAddress = document.getElementById('businessAddress').value;
        info.businessType = document.getElementById('businessType').value;
        info.businessItem = document.getElementById('businessItem').value;
        info.taxEmail = document.getElementById('taxEmail').value;
        info.hasBusinessLicense = !!uploadedFile;
        if (uploadedFile) {
            info.businessLicenseFileName = uploadedFile.name;
        }
    } else if (selectedPaymentMethod === 'receipt') {
        info.receiptType = document.getElementById('receiptType').value;
        info.receiptNumber = document.getElementById('receiptNumber').value;
    }
    
    return info;
}

// Logout
function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}
