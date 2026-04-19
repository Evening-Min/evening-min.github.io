// index.js
document.addEventListener('DOMContentLoaded', () => {
    loadRecentReviews();
});

async function loadRecentReviews() {
    try {
        const res = await fetch('data.json?t=' + new Date().getTime());
        const data = await res.json();
        
        // 1. 발행된 시승기만 필터링 후 최신순 정렬
        const publishedData = data.filter(car => car.isPublished === true).reverse();
        
        // 2. 상위 3개만 추출
        const recentData = publishedData.slice(0, 3);
        
        renderRecentCards(recentData);
    } catch (e) {
        console.error("데이터 로드 실패:", e);
    }
}

function renderRecentCards(items) {
    const grid = document.getElementById('recent-post-grid');
    if (!grid) return;
    
    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#888; padding: 40px 0;">최근 발행된 시승기가 없습니다.</p>';
        return;
    }

    items.forEach(car => {
        // 대표 이미지 (1.jpg) 경로 설정
        const thumbImg = car.imageFolder ? `images/${car.imageFolder}/1.jpg` : null;
        
        const card = document.createElement('article');
        card.className = 'post-card';
        card.onclick = () => location.href = `post.html?path=${car.reviewPath}`;

        const imageHTML = thumbImg 
            ? `<img src="${thumbImg}" onerror="handleImgError(this)" alt="${car.name}">`
            : `<div class="no-image-placeholder">사진 없음</div>`;

        card.innerHTML = `
            <div class="card-image-container">
                ${imageHTML}
            </div>
            <div class="card-content">
                <div class="card-meta">
                    <span>${car.year}</span>
                    <span>${car.brand}</span>
                    <span>${car.name}</span>
                </div>
                <h3 class="card-title">${car.postTitle || '제목 없는 시승기'}</h3>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 전역 이미지 에러 핸들러
window.handleImgError = function(img) {
    const container = img.parentElement;
    container.innerHTML = '<div class="no-image-placeholder">사진 없음</div>';
};