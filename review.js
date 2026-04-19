/*
 * Name: Youngmin Jeon
 * Date: April 14, 2024
 * Section: IAB 6068
 * This is javascript for the review page.
 */

let allPublishedData = [];
let currentPage = 1;
const itemsPerPage = 6;

document.addEventListener('DOMContentLoaded', () => {
    loadReviewData();
});

async function loadReviewData() {
    try {
        const res = await fetch('data.json?t=' + new Date().getTime());
        const data = await res.json();
        
        // 시승기가 발행된 데이터만 필터링 (최신순 정렬)
        allPublishedData = data.filter(car => car.isPublished === true).reverse();
        
        renderReviewPage(1);
    } catch (e) {
        console.error("리뷰 로드 실패:", e);
    }
}

function renderReviewPage(page) {
    currentPage = page;
    const grid = document.getElementById('review-grid');
    grid.innerHTML = '';

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pagedData = allPublishedData.slice(start, end);

    pagedData.forEach(car => {
    // 이미지 경로 설정
    const thumbImg = car.imageFolder ? `images/${car.imageFolder}/1.jpg` : null;
    
    const card = document.createElement('article');
    card.className = 'post-card';
    card.onclick = () => location.href = `post.html?path=${car.reviewPath}`;

    // 이미지 영역 처리: 이미지가 있으면 img 태그, 없으면 placeholder div
    const imageHTML = thumbImg 
        ? `<img src="${thumbImg}" onerror="handleImgError(this)" alt="${car.name}">`
        : `<div class="no-image-placeholder">사진 없음</div>`;

    card.innerHTML = `
        <div class="card-image-container">
            ${imageHTML}
        </div>
        <div class="card-content">
            <div class="card-meta">
                <span class="meta-item">${car.year}</span>
                <span class="meta-item">${car.brand}</span>
                <span class="meta-item">${car.name}</span>
            </div>
            <h3 class="card-title">${car.postTitle || '제목 없는 시승기'}</h3>
        </div>
    `;
    grid.appendChild(card);
});

// 이미지 로드 실패 시(경로에 파일이 없을 때) 처리 함수
window.handleImgError = function(img) {
    const container = img.parentElement;
    container.innerHTML = `<div class="no-image-placeholder">사진 없음</div>`;
};

    renderPagination();
}

function renderPagination() {
    const container = document.getElementById('pagination-container');
    container.innerHTML = '';

    const totalPages = Math.ceil(allPublishedData.length / itemsPerPage);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        if (i === currentPage) btn.className = 'active';
        btn.onclick = () => {
            renderReviewPage(i);
            window.scrollTo(0, 400); // 클릭 시 스크롤 상단 이동
        };
        container.appendChild(btn);
    }
}
