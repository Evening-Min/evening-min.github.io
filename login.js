// login.js 수정본
document.addEventListener('DOMContentLoaded', () => {
    // [추가] 이미 로그인된 상태라면 로그인 페이지를 건너뛰고 바로 어드민으로 이동
    if (sessionStorage.getItem("isLoggedIn") === "true") {
        window.location.replace("admin.html"); 
        return; // 아래 코드 실행 방지
    }

    const loginBtn = document.getElementById('btn-login');
    const idInput = document.getElementById('admin-id');
    const pwInput = document.getElementById('admin-pw');

    const performLogin = () => {
        const ADMIN_ID = "admin";
        const ADMIN_PW = "Adm!n";
        const errorText = document.getElementById('error-text');

        if (idInput.value === ADMIN_ID && pwInput.value === ADMIN_PW) {
            sessionStorage.setItem("isLoggedIn", "true");
            // replace를 사용하면 브라우저 히스토리에 로그인 페이지가 남지 않아 보안상 더 좋습니다.
            window.location.replace("admin.html"); 
        } else {
            errorText.style.display = 'block';
            pwInput.value = "";
            pwInput.focus();
        }
    };

    loginBtn.addEventListener('click', performLogin);

    [idInput, pwInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performLogin();
        });
    });
});