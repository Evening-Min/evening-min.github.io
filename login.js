document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('btn-login');
    const idInput = document.getElementById('admin-id');
    const pwInput = document.getElementById('admin-pw');

    // 로그인 실행 함수
    const performLogin = () => {
        const ADMIN_ID = "admin";
        const ADMIN_PW = "Adm!n";
        const errorText = document.getElementById('error-text');

        if (idInput.value === ADMIN_ID && pwInput.value === ADMIN_PW) {
            sessionStorage.setItem("isLoggedIn", "true");
            window.location.href = "admin.html";
        } else {
            errorText.style.display = 'block';
            pwInput.value = "";
            pwInput.focus();
        }
    };

    // 버튼 클릭 이벤트
    loginBtn.addEventListener('click', performLogin);

    // 엔터키 입력 이벤트
    [idInput, pwInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performLogin();
        });
    });
});