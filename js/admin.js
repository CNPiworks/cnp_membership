// Admin Dashboard JavaScript
let allMembers = [];
let allMemberships = [];
let filteredMembers = [];
let currentPage = 1;
const itemsPerPage = 20;

// Check if user is admin on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAccess();
    loadAdminData();
});

// Check admin access
function checkAdminAccess() {
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        alert('로그인이 필요합니다.');
        window.location.href = 'login.html';
        return;
    }
    
    // Check if user is admin (you can customize this logic)
    // For now, we'll check if email contains 'admin' or if it's a specific admin email
    const adminEmails = [
        'admin@cnpgroup.co.kr',
        'iworks@cnpgroup.co.kr',
        'admin@cnp.co.kr',
        'snkim@cnpgroup.co.kr',
        'jmkim@cnpgroup.co.kr'
    ];
    
    const isAdmin = adminEmails.includes(currentUser.email.toLowerCase()) || 
                    currentUser.email.toLowerCase().includes('admin');
    
    if (!isAdmin) {
        alert('관리자 권한이 필요합니다.');
        window.location.href = 'dashboard.html';
        return;
    }
}

// Load all admin data
async function loadAdminData() {
    try {
        // Load users
        const usersResponse = await apiRequest('tables/users?limit=1000');
        allMembers = usersResponse.data || [];
        
        // Load memberships
        const membershipsResponse = await apiRequest('tables/memberships?limit=1000');
        allMemberships = membershipsResponse.data || [];
        
        // Merge membership data with users
        allMembers = allMembers.map(user => {
            if (user.membership_id) {
                const membership = allMemberships.find(m => m.id === user.membership_id);
                if (membership) {
                    user.seats_purchased = membership.seats_purchased;
                    user.membership_status = membership.status;
                    user.membership_start = membership.start_date;
                    user.membership_end = membership.end_date;
                }
            }
            return user;
        });
        
        // Calculate statistics
        updateStatistics();
        
        // Initialize filtered members
        filteredMembers = [...allMembers];
        
        // Render table
        renderMembersTable();
        
    } catch (error) {
        console.error('Error loading admin data:', error);
        showErrorInTable('데이터를 불러오는 중 오류가 발생했습니다.');
    }
}

// Update statistics
function updateStatistics() {
    const totalMembers = allMembers.length;
    const individualMembers = allMembers.filter(m => m.user_type === 'individual').length;
    const companyMembers = allMembers.filter(m => m.user_type === 'company').length;
    const membershipCount = allMembers.filter(m => m.membership_type === 'membership').length;
    
    let totalSeats = 0;
    let totalRevenue = 0;
    
    allMembers.forEach(member => {
        if (member.membership_type === 'membership' && member.seats_purchased) {
            totalSeats += member.seats_purchased;
            totalRevenue += member.seats_purchased * 1000000;
        }
    });
    
    document.getElementById('totalMembers').textContent = totalMembers;
    document.getElementById('individualMembers').textContent = individualMembers;
    document.getElementById('companyMembers').textContent = companyMembers;
    document.getElementById('membershipCount').textContent = membershipCount;
    document.getElementById('totalSeats').textContent = totalSeats;
    document.getElementById('totalRevenue').textContent = totalRevenue.toLocaleString('ko-KR') + '원';
}

// Apply filters
function applyFilters() {
    const userType = document.getElementById('filterUserType').value;
    const membershipType = document.getElementById('filterMembershipType').value;
    const keyword = document.getElementById('searchKeyword').value.toLowerCase();
    
    filteredMembers = allMembers.filter(member => {
        // User type filter
        if (userType && member.user_type !== userType) return false;
        
        // Membership type filter
        if (membershipType && member.membership_type !== membershipType) return false;
        
        // Keyword search
        if (keyword) {
            const searchText = [
                member.name || '',
                member.email || '',
                member.company || '',
                member.phone || ''
            ].join(' ').toLowerCase();
            
            if (!searchText.includes(keyword)) return false;
        }
        
        return true;
    });
    
    currentPage = 1;
    renderMembersTable();
}

// Render members table
function renderMembersTable() {
    const tbody = document.getElementById('membersTableBody');
    const memberCount = document.getElementById('memberCount');
    
    if (filteredMembers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <p>조회된 회원이 없습니다.</p>
                </td>
            </tr>
        `;
        memberCount.textContent = '총 0명';
        updatePagination();
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredMembers.length);
    const pageMembers = filteredMembers.slice(startIndex, endIndex);
    
    // Render rows
    tbody.innerHTML = pageMembers.map(member => {
        const userTypeBadge = member.user_type === 'individual' 
            ? '<span class="badge individual">개인</span>' 
            : '<span class="badge company">사업자</span>';
        
        const membershipBadge = member.membership_type === 'membership' 
            ? '<span class="badge membership">멤버십</span>' 
            : '<span class="badge none">일반</span>';
        
        const joinDate = member.created_at 
            ? new Date(member.created_at).toLocaleDateString('ko-KR') 
            : '-';
        
        return `
            <tr>
                <td>${joinDate}</td>
                <td><strong>${member.name || '-'}</strong></td>
                <td>${member.email || '-'}</td>
                <td>${member.phone || '-'}</td>
                <td>${userTypeBadge}</td>
                <td>${membershipBadge}</td>
                <td>${member.company || '-'}</td>
                <td>${member.seats_purchased || '-'}</td>
                <td>${member.business_number || '-'}</td>
                <td>${member.ceo_name || '-'}</td>
            </tr>
        `;
    }).join('');
    
    memberCount.textContent = `총 ${filteredMembers.length}명`;
    updatePagination();
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    pageInfo.textContent = `${currentPage} / ${totalPages || 1}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

// Previous page
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderMembersTable();
    }
}

// Next page
function nextPage() {
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderMembersTable();
    }
}

// Show error in table
function showErrorInTable(message) {
    const tbody = document.getElementById('membersTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="10" class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </td>
        </tr>
    `;
}

// Export to CSV
function exportToCSV() {
    if (filteredMembers.length === 0) {
        alert('내보낼 데이터가 없습니다.');
        return;
    }
    
    // CSV headers
    const headers = [
        '가입일',
        '이름',
        '이메일',
        '전화번호',
        '회원유형',
        '멤버십유형',
        '회사명',
        '좌석수',
        '사업자등록번호',
        '대표자명'
    ];
    
    // CSV rows
    const rows = filteredMembers.map(member => {
        const joinDate = member.created_at 
            ? new Date(member.created_at).toLocaleDateString('ko-KR') 
            : '';
        
        const userType = member.user_type === 'individual' ? '개인' : '사업자';
        const membershipType = member.membership_type === 'membership' ? '멤버십' : '일반';
        
        return [
            joinDate,
            member.name || '',
            member.email || '',
            member.phone || '',
            userType,
            membershipType,
            member.company || '',
            member.seats_purchased || '',
            member.business_number || '',
            member.ceo_name || ''
        ];
    });
    
    // Create CSV content
    let csvContent = '\uFEFF'; // UTF-8 BOM for Excel
    csvContent += headers.join(',') + '\n';
    rows.forEach(row => {
        csvContent += row.map(field => `"${field}"`).join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `CNP아카데미_회원목록_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('CSV 파일이 다운로드되었습니다.');
}

// Logout function
function logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}
