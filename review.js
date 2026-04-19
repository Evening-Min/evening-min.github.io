/**
 * review.js
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
        // 이미지 폴더 내의 1.jpg를 썸네일로 사용 (없을 시 히어로 이미지 대체)
        const thumbImg = car.imageFolder ? `images/${car.imageFolder}/1.jpg` : 'images/review-car.jpeg';
        
        const card = document.createElement('article');
        card.className = 'post-card';
        card.onclick = () => location.href = `post.html?path=${car.reviewPath}`;

        card.innerHTML = `
            <div class="card-image-container">
                <img src="${thumbImg}" onerror="this.src='images/review-car.jpeg'" alt="${car.name}">
            </div>
            <div class="card-content">
                <div class="card-meta">[${car.year}] [${car.brand}] [${car.name}]</div>
                <h3 class="card-title">${car.postTitle || '제목 없는 시승기'}</h3>
            </div>
        `;
        grid.appendChild(card);
    });

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