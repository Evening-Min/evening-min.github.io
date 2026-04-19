/*
 * Name: Youngmin Jeon
 * Date: April 14, 2024
 * Section: IAB 6068
 * This is javascript for the review post viewer page.
 */

let currentImages = [];
let currentIdx = 0;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const path = params.get('path');

    if (!path) {
        alert("시승기 경로가 없습니다.");
        return;
    }

    try {
        // 1. 개별 시승기 JSON 데이터 가져오기
        const res = await fetch(path + '?t=' + new Date().getTime());
        const data = await res.json();
        
        // 2. 제목 및 날짜 렌더링
        document.getElementById('post-title').innerText = data.title;
        document.getElementById('post-date').innerText = `Published on ${data.updatedAt ? data.updatedAt.split('T')[0] : 'Unknown Date'}`;
        document.getElementById('post-content').innerText = data.content;

        // 3. 차량 정보 테이블 렌더링
        // 만약 data.carInfo가 없다면, data.json에서 정보를 매칭해서 가져오는 로직이 필요할 수 있습니다.
        // 여기서는 데이터에 포함되어 있다고 가정하거나 기본 정보를 표시합니다.
        renderInfoTable(data);

        // 4. 이미지 슬라이더 초기화 (자동 번호 규칙 적용)
        if (data.imageFolder && data.imageCount > 0) {
            currentImages = [];
            for (let i = 1; i <= data.imageCount; i++) {
                // editor.js에서 저장한 규칙(1.jpg, 2.jpg...)대로 경로 생성
                currentImages.push(`images/${data.imageFolder}/${i}.jpg`);
            }
            updateSlider();
        } else {
            // 이미지가 없는 경우 슬라이더 영역을 숨기거나 "사진 없음" 처리
            document.getElementById('image-slider').innerHTML = '<div class="no-image-placeholder">등록된 사진이 없습니다.</div>';
        }

    } catch (e) {
        console.error("데이터 로딩 실패:", e);
    }

    // 슬라이더 버튼 이벤트
    document.getElementById('prev-btn').onclick = () => moveSlide(-1);
    document.getElementById('next-btn').onclick = () => moveSlide(1);
});

// post.js 내의 renderInfoTable 호출 부분
function renderInfoTable(data) {
    const tbody = document.getElementById('info-table-body');
    if (!tbody) return;

    // editor.js에서 저장한 carDetails를 가져옴
    const info = data.carDetails || {}; 
    const labels = { 
        brand: '브랜드', 
        year: '연식', 
        name: '모델명', 
        fuel: '연료', 
        price: '가격' 
    };
    
    let html = '';
    // 정해진 라벨 순서대로 표 구성
    Object.keys(labels).forEach(key => {
        html += `<tr><th>${labels[key]}</th><td>${info[key] || '정보 없음'}</td></tr>`;
    });
    
    tbody.innerHTML = html;
}

function updateSlider() {
    if (currentImages.length === 0) return;
    const imgTag = document.getElementById('current-slide');
    const counter = document.getElementById('slide-counter');
    
    imgTag.src = currentImages[currentIdx];
    // 사진 로드 실패 시 처리
    imgTag.onerror = () => {
        imgTag.src = 'images/review-car.jpeg'; // 또는 placeholder
    };
    counter.innerText = `${currentIdx + 1} / ${currentImages.length}`;
}

function moveSlide(step) {
    if (currentImages.length === 0) return;
    currentIdx += step;
    if (currentIdx < 0) currentIdx = currentImages.length - 1;
    if (currentIdx >= currentImages.length) currentIdx = 0;
    updateSlider();
}