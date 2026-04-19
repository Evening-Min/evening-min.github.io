document.addEventListener('DOMContentLoaded', () => {
    loadCarList();
    document.getElementById('btn-save-post').onclick = savePost;
});

// 1. 기존 DB에서 차량 목록 불러오기
async function loadCarList() {
    const res = await fetch('data.json');
    const data = await res.json();
    const selector = document.getElementById('car-selector');

    data.forEach((car, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.innerText = `${car.brand} ${car.name} (${car.year})`;
        selector.appendChild(opt);
    });
}

// 2. 시승기 저장 (GitHub API 연동)
async function savePost() {
    const carIndex = document.getElementById('car-selector').value;
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const thumb = document.getElementById('thumbnail-url').value;

    if (!carIndex || !title || !content) {
        alert("차량 선택, 제목, 본문은 필수입니다.");
        return;
    }

    // 어제 만든 GitHub 업데이트 로직 재활용
    // 실제 구현 시 data.json의 해당 객체에 title, content 등을 업데이트하는 방식
    alert("현재 데이터 구조에 시승기 본문을 결합하는 중입니다...");
    // 여기에 saveToGitHub 로직이 들어갑니다.
}