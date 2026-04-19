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
        const res = await fetch(path + '?t=' + new Date().getTime());
        const data = await res.json();
        
        // 1. 기본 텍스트 렌더링
        document.getElementById('post-title').innerText = data.title;
        document.getElementById('post-date').innerText = `Published on ${data.updatedAt.split('T')[0]}`;
        document.getElementById('post-content').innerText = data.content;

        // 2. 차량 정보 테이블 생성 (data.json에서 정보를 가져와야 함 - 여기선 예시)
        // 실제로는 post 데이터 내에 carInfo가 포함되도록 에디터를 수정했거나,
        // data.json을 한 번 더 참조해야 합니다.
        renderInfoTable(data.carInfo || {});

        // 3. 이미지 슬라이더 초기화
        if (data.imageFolder && data.imageCount > 0) {
            for (let i = 1; i <= data.imageCount; i++) {
                currentImages.push(`images/${data.imageFolder}/${i}.jpg`);
            }
            updateSlider();
        }

    } catch (e) {
        console.error("데이터 로딩 실패:", e);
    }

    // 슬라이더 버튼 이벤트
    document.getElementById('prev-btn').onclick = () => moveSlide(-1);
    document.getElementById('next-btn').onclick = () => moveSlide(1);
});

function renderInfoTable(info) {
    const tbody = document.getElementById('info-table-body');
    const labels = { brand: '브랜드', year: '연식', name: '모델명', fuel: '연료', price: '가격' };
    
    let html = '';
    for (const key in labels) {
        html += `<tr><th>${labels[key]}</th><td>${info[key] || '-'}</td></tr>`;
    }
    tbody.innerHTML = html;
}

function updateSlider() {
    const imgTag = document.getElementById('current-slide');
    const counter = document.getElementById('slide-counter');
    
    imgTag.src = currentImages[currentIdx];
    counter.innerText = `${currentIdx + 1} / ${currentImages.length}`;
}

function moveSlide(step) {
    currentIdx += step;
    if (currentIdx < 0) currentIdx = currentImages.length - 1;
    if (currentIdx >= currentImages.length) currentIdx = 0;
    updateSlider();
}