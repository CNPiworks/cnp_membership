// Registration page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    let selectedUserType = null; // 'individual' or 'business'
    let hasMembership = false;

    // Step 1: User type selection
    const userTypeBtns = document.querySelectorAll('[data-user-type]');
    userTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            selectedUserType = this.getAttribute('data-user-type');
            
            // Update button active state
            userTypeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Go to step 2
            setTimeout(() => {
                document.getElementById('step1').classList.remove('active');
                document.getElementById('step2').classList.add('active');
                
                // Show appropriate form
                if (selectedUserType === 'individual') {
                    document.getElementById('individualForm').style.display = 'block';
                    document.getElementById('businessForm').style.display = 'none';
                } else {
                    document.getElementById('individualForm').style.display = 'none';
                    document.getElementById('businessForm').style.display = 'block';
                }
            }, 200);
        });
    });

    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            document.getElementById('step2').classList.remove('active');
            document.getElementById('step1').classList.add('active');
        });
    }

    // Individual membership checkbox
    const indivMembershipCheck = document.getElementById('indiv_membership_check');
    if (indivMembershipCheck) {
        indivMembershipCheck.addEventListener('change', function() {
            const membershipInfo = document.getElementById('individualMembershipInfo');
            if (this.checked) {
                membershipInfo.style.display = 'block';
                hasMembership = true;
            } else {
                membershipInfo.style.display = 'none';
                hasMembership = false;
            }
        });
    }

    // Business membership checkbox
    const bizMembershipCheck = document.getElementById('biz_membership_check');
    if (bizMembershipCheck) {
        bizMembershipCheck.addEventListener('change', function() {
            const membershipInfo = document.getElementById('businessMembershipInfo');
            if (this.checked) {
                membershipInfo.style.display = 'block';
                hasMembership = true;
            } else {
                membershipInfo.style.display = 'none';
                hasMembership = false;
            }
        });
    }

    // Individual seats input calculator
    const indivSeatsInput = document.getElementById('indiv_seats');
    if (indivSeatsInput) {
        indivSeatsInput.addEventListener('input', function() {
            const seats = parseInt(this.value) || 1;
            const total = seats * 1000000;
            document.getElementById('indiv_calc_seats').textContent = seats;
            document.getElementById('indiv_calc_total').textContent = total.toLocaleString('ko-KR') + '원';
        });
    }

    // Business seats input calculator
    const bizSeatsInput = document.getElementById('biz_seats');
    if (bizSeatsInput) {
        bizSeatsInput.addEventListener('input', function() {
            const seats = parseInt(this.value) || 1;
            const total = seats * 1000000;
            document.getElementById('biz_calc_seats').textContent = seats;
            document.getElementById('biz_calc_total').textContent = total.toLocaleString('ko-KR') + '원';
        });
    }

    // Individual form submission
    const individualForm = document.getElementById('individualForm');
    if (individualForm) {
        individualForm.addEventListener('submit', handleIndividualRegistration);
    }

    // Business form submission
    const businessForm = document.getElementById('businessForm');
    if (businessForm) {
        businessForm.addEventListener('submit', handleBusinessRegistration);
    }
});

// Handle individual registration
async function handleIndividualRegistration(e) {
    e.preventDefault();
    
    const name = document.getElementById('indiv_name').value;
    const email = document.getElementById('indiv_email').value;
    const password = document.getElementById('indiv_password').value;
    const passwordConfirm = document.getElementById('indiv_password_confirm').value;
    const phone = document.getElementById('indiv_phone').value;
    const company = document.getElementById('indiv_company').value;
    const termsAccepted = document.getElementById('indiv_terms').checked;
    const hasMembership = document.getElementById('indiv_membership_check').checked;
    
    // Validation
    if (password !== passwordConfirm) {
        showMessage('registerMessage', '비밀번호가 일치하지 않습니다.', 'error');
        return;
    }
    
    if (!termsAccepted) {
        showMessage('registerMessage', '이용약관에 동의해주세요.', 'error');
        return;
    }
    
    try {
        // Check if email already exists
        const checkResponse = await apiRequest('tables/users?limit=1000');
        const existingUsers = checkResponse.data || [];
        const emailExists = existingUsers.some(u => u.email === email);
        
        if (emailExists) {
            showMessage('registerMessage', '이미 등록된 이메일입니다.', 'error');
            return;
        }
        
        let membershipId = '';
        
        // If membership is selected, create membership first
        if (hasMembership) {
            const seats = parseInt(document.getElementById('indiv_seats').value) || 1;
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);
            
            const membershipData = {
                company_name: name + ' (개인)', // Individual's name as company name
                admin_user_id: '', // Will be updated after user creation
                seats_purchased: seats,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: 'active',
                total_amount: seats * 1000000
            };
            
            const membershipResponse = await apiRequest('tables/memberships', {
                method: 'POST',
                body: JSON.stringify(membershipData)
            });
            
            membershipId = membershipResponse.id;
        }
        
        // Create user
        const userData = {
            email: email,
            password: hashPassword(password),
            name: name,
            phone: phone,
            company: company || '',
            user_type: 'individual',
            membership_type: hasMembership ? 'membership' : 'none',
            membership_id: membershipId
        };
        
        const response = await apiRequest('tables/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        // Update membership admin_user_id if membership was created
        if (hasMembership && membershipId) {
            await apiRequest(`tables/memberships/${membershipId}`, {
                method: 'PATCH',
                body: JSON.stringify({ admin_user_id: response.id })
            });
            
            // Auto-enroll in all courses for membership users
            await autoEnrollAllCourses(response.id, membershipId);
        }
        
        showMessage('registerMessage', '회원가입이 완료되었습니다! 로그인 페이지로 이동합니다...', 'success');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('registerMessage', '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
}

// Auto-enroll user in all courses (for membership users)
async function autoEnrollAllCourses(userId, membershipId) {
    try {
        // Get all courses
        const coursesResponse = await apiRequest('tables/courses?limit=100');
        const courses = coursesResponse.data || [];
        
        if (courses.length === 0) {
            console.log('No courses found to enroll');
            return;
        }
        
        // Create enrollments for all courses
        const enrollmentPromises = courses.map(course => {
            const enrollmentData = {
                user_id: userId,
                course_id: course.id,
                enrollment_type: 'membership',
                membership_id: membershipId,
                enrollment_date: new Date().toISOString(),
                status: 'enrolled'
            };
            
            return apiRequest('tables/enrollments', {
                method: 'POST',
                body: JSON.stringify(enrollmentData)
            });
        });
        
        // Execute all enrollments
        await Promise.all(enrollmentPromises);
        console.log(`Successfully enrolled user ${userId} in ${courses.length} courses`);
        
    } catch (error) {
        console.error('Error auto-enrolling in courses:', error);
        // Don't throw error - registration should still succeed
    }
}

// Handle business registration
async function handleBusinessRegistration(e) {
    e.preventDefault();
    
    const businessNumber = document.getElementById('biz_business_number').value;
    const companyName = document.getElementById('biz_company_name').value;
    const ceoName = document.getElementById('biz_ceo_name').value;
    const adminName = document.getElementById('biz_admin_name').value;
    const email = document.getElementById('biz_email').value;
    const password = document.getElementById('biz_password').value;
    const passwordConfirm = document.getElementById('biz_password_confirm').value;
    const phone = document.getElementById('biz_phone').value;
    const termsAccepted = document.getElementById('biz_terms').checked;
    const hasMembership = document.getElementById('biz_membership_check').checked;
    
    // Validation
    if (password !== passwordConfirm) {
        showMessage('registerMessage', '비밀번호가 일치하지 않습니다.', 'error');
        return;
    }
    
    if (!termsAccepted) {
        showMessage('registerMessage', '이용약관에 동의해주세요.', 'error');
        return;
    }
    
    try {
        // Check if email already exists
        const checkResponse = await apiRequest('tables/users?limit=1000');
        const existingUsers = checkResponse.data || [];
        const emailExists = existingUsers.some(u => u.email === email);
        
        if (emailExists) {
            showMessage('registerMessage', '이미 등록된 이메일입니다.', 'error');
            return;
        }
        
        let membershipId = '';
        
        // If membership is selected, create membership first
        if (hasMembership) {
            const seats = parseInt(document.getElementById('biz_seats').value) || 1;
            const startDate = new Date();
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1);
            
            const membershipData = {
                company_name: companyName,
                admin_user_id: '', // Will be updated after user creation
                seats_purchased: seats,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: 'active',
                total_amount: seats * 1000000
            };
            
            const membershipResponse = await apiRequest('tables/memberships', {
                method: 'POST',
                body: JSON.stringify(membershipData)
            });
            
            membershipId = membershipResponse.id;
        }
        
        // Create user with business info
        const userData = {
            email: email,
            password: hashPassword(password),
            name: adminName,
            phone: phone,
            company: companyName,
            user_type: 'company',
            membership_type: hasMembership ? 'membership' : 'none',
            membership_id: membershipId,
            business_number: businessNumber,
            ceo_name: ceoName
        };
        
        const response = await apiRequest('tables/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        // Update membership admin_user_id if membership was created
        if (hasMembership && membershipId) {
            await apiRequest(`tables/memberships/${membershipId}`, {
                method: 'PATCH',
                body: JSON.stringify({ admin_user_id: response.id })
            });
            
            // Auto-enroll in all courses for membership users
            await autoEnrollAllCourses(response.id, membershipId);
        }
        
        showMessage('registerMessage', '회원가입이 완료되었습니다! 로그인 페이지로 이동합니다...', 'success');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('registerMessage', '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
}

// Auto-enroll user in all courses (for membership users)
async function autoEnrollAllCourses(userId, membershipId) {
    try {
        // Get all courses
        const coursesResponse = await apiRequest('tables/courses?limit=100');
        const courses = coursesResponse.data || [];
        
        if (courses.length === 0) {
            console.log('No courses found to enroll');
            return;
        }
        
        // Create enrollments for all courses
        const enrollmentPromises = courses.map(course => {
            const enrollmentData = {
                user_id: userId,
                course_id: course.id,
                enrollment_type: 'membership',
                membership_id: membershipId,
                enrollment_date: new Date().toISOString(),
                status: 'enrolled'
            };
            
            return apiRequest('tables/enrollments', {
                method: 'POST',
                body: JSON.stringify(enrollmentData)
            });
        });
        
        // Execute all enrollments
        await Promise.all(enrollmentPromises);
        console.log(`Successfully enrolled user ${userId} in ${courses.length} courses`);
        
    } catch (error) {
        console.error('Error auto-enrolling in courses:', error);
        // Don't throw error - registration should still succeed
    }
}
