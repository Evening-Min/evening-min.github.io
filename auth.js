/*
 * Name: Youngmin Jeon
 * Date: April 14, 2024
 * Section: IAB 6068
 * This is javascript for the authentication of administrator page.
 */

// 페이지 로드 시 즉시 로그인 여부 검사
(function checkAuth() {
    if (sessionStorage.getItem("isLoggedIn") !== "true") {
        alert("관리자 권한이 없습니다. 로그인 페이지로 이동합니다.");
        window.location.href = "login.html";
    }
})();

// 로그아웃 공통 함수
function logout() {
    sessionStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
}