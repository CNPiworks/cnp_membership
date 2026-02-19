// Authentication JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Individual registration form
    const individualForm = document.getElementById('individualForm');
    if (individualForm) {
        individualForm.addEventListener('submit', handleIndividualRegistration);
    }

    // Membership registration form
    const membershipForm = document.getElementById('membershipForm');
    if (membershipForm) {
        membershipForm.addEventListener('submit', handleMembershipRegistration);
        
        // Update price calculator
        const seatsInput = document.getElementById('seats_purchased');
        if (seatsInput) {
            seatsInput.addEventListener('input', updatePriceCalculator);
        }
    }

    // Registration type selector
    setupRegistrationTypeSelector();

    // Check URL parameters for registration type
    const urlParams = new URLSearchParams(window.location.search);
    const regType = urlParams.get('type');
    if (regType) {
        switchRegistrationType(regType);
    }
});

// Setup registration type selector
function setupRegistrationTypeSelector() {
    const typeButtons = document.querySelectorAll('.type-btn');
    
    typeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            switchRegistrationType(type);
        });
    });
}

// Switch registration type
function switchRegistrationType(type) {
    // Update buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-type') === type) {
            btn.classList.add('active');
        }
    });
    
    // Update forms
    document.querySelectorAll('.registration-form').forEach(form => {
        form.classList.remove('active');
    });
    
    if (type === 'individual') {
        document.getElementById('individualForm').classList.add('active');
    } else if (type === 'membership') {
        document.getElementById('membershipForm').classList.add('active');
    }
}

// Update price calculator
function updatePriceCalculator() {
    const seats = parseInt(document.getElementById('seats_purchased').value) || 1;
    const pricePerSeat = 1000000;
    const total = seats * pricePerSeat;
    
    document.getElementById('calc_seats').textContent = seats;
    document.getElementById('calc_total').textContent = total.toLocaleString('ko-KR') + '원';
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        // Get all users and find matching credentials
        const response = await apiRequest('tables/users?limit=1000');
        const users = response.data || [];
        
        const hashedPassword = hashPassword(password);
        const user = users.find(u => u.email === email && u.password === hashedPassword);
        
        if (!user) {
            showMessage('loginMessage', '이메일 또는 비밀번호가 올바르지 않습니다.', 'error');
            return;
        }
        
        // Save user session
        setCurrentUser(user);
        
        showMessage('loginMessage', '로그인 성공! 대시보드로 이동합니다...', 'success');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage('loginMessage', '로그인 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
}

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
        
        // Create user
        const userData = {
            email: email,
            password: hashPassword(password),
            name: name,
            phone: phone,
            company: company || '',
            user_type: 'individual',
            membership_id: ''
        };
        
        const response = await apiRequest('tables/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        showMessage('registerMessage', '회원가입이 완료되었습니다! 로그인 페이지로 이동합니다...', 'success');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('registerMessage', '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
}

// Handle membership registration
async function handleMembershipRegistration(e) {
    e.preventDefault();
    
    const companyName = document.getElementById('mem_company_name').value;
    const adminName = document.getElementById('mem_admin_name').value;
    const email = document.getElementById('mem_email').value;
    const password = document.getElementById('mem_password').value;
    const passwordConfirm = document.getElementById('mem_password_confirm').value;
    const phone = document.getElementById('mem_phone').value;
    const seatsPurchased = parseInt(document.getElementById('seats_purchased').value);
    const termsAccepted = document.getElementById('mem_terms').checked;
    
    // Validation
    if (password !== passwordConfirm) {
        showMessage('registerMessage', '비밀번호가 일치하지 않습니다.', 'error');
        return;
    }
    
    if (!termsAccepted) {
        showMessage('registerMessage', '이용약관에 동의해주세요.', 'error');
        return;
    }
    
    if (seatsPurchased < 1) {
        showMessage('registerMessage', '최소 1개 이상의 좌석을 구매해야 합니다.', 'error');
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
        
        // Create membership
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1); // 1 year from now
        
        const membershipData = {
            company_name: companyName,
            admin_user_id: '', // Will be updated after user creation
            seats_purchased: seatsPurchased,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'active',
            total_amount: seatsPurchased * 1000000
        };
        
        const membershipResponse = await apiRequest('tables/memberships', {
            method: 'POST',
            body: JSON.stringify(membershipData)
        });
        
        // Create admin user
        const userData = {
            email: email,
            password: hashPassword(password),
            name: adminName,
            phone: phone,
            company: companyName,
            user_type: 'company',
            membership_id: membershipResponse.id
        };
        
        const userResponse = await apiRequest('tables/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        // Update membership with admin user ID
        await apiRequest(`tables/memberships/${membershipResponse.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
                admin_user_id: userResponse.id
            })
        });
        
        showMessage('registerMessage', '멤버쉽 등록이 완료되었습니다! 로그인 페이지로 이동합니다...', 'success');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        console.error('Membership registration error:', error);
        showMessage('registerMessage', '멤버쉽 등록 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
}