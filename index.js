/*
 * Name: Youngmin Jeon
 * Date: April 14, 2024
 * Section: IAB 6068
 * This is javascript for the main page(index)
 */

document.addEventListener('DOMContentLoaded', () => {
    loadRecentReviews();
    loadBestMaintenanceItems();
    importCareerFromAbout();
});

async function loadRecentReviews() {
    try {
        const res = await fetch('data.json?t=' + new Date().getTime());
        const data = await res.json();
        
        // 1. 발행된 시승기만 필터링 후 최신순 정렬
        const publishedData = data.filter(car => car.isPublished === true).reverse();
        
        // 2. 상위 3개만 추출
        const recentData = publishedData.slice(0, 2);
        
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

async function loadBestMaintenanceItems() {
    try {
        const res = await fetch('maintenance.json?t=' + new Date().getTime());
        const data = await res.json();
        
        // 별점(rating)이 5점인 것 중 최신순 2~3개 추출
        const bestItems = data.filter(item => item.rating === 5).reverse().slice(0, 2);
        renderBestItems(bestItems);
    } catch (e) {
        console.error("정비 데이터 로드 실패:", e);
    }
}

function renderBestItems(items) {
    const container = document.getElementById('best-items-container');
    if (!container) return;
    
    container.innerHTML = items.map(item => `
        <article class="post-card" onclick="location.href='maintenance.html'">
            <div class="card-content" style="padding: 20px;">
                <div class="card-meta">
                    <span>${item.date}</span>
                    <span>추천 부품</span>
                </div>
                <h3 class="card-title">⭐ ${item.item}</h3>
                <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">${item.comment}</p>
            </div>
        </article>
    `).join('');
}

async function importCareerFromAbout() {
    try {
        // 1. about.html 파일 전체를 텍스트로 가져옵니다.
        const response = await fetch('about.html');
        const htmlString = await response.text();

        // 2. 가상의 DOM 객체를 만들어 텍스트를 HTML로 파싱합니다.
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        // 3. about.html 내의 .career-list 요소를 찾아옵니다.
        const careerContent = doc.querySelector('.career-list');
        const sidebarContainer = document.querySelector('.about-sidebar');

        if (careerContent && sidebarContainer) {
            // 4. 인덱스 페이지의 사이드바 제목 아래에 내용을 집어넣습니다.
            // 기존에 하드코딩된 내용이 있다면 덮어씌우거나 추가합니다.
            const title = sidebarContainer.querySelector('.section-title');
            sidebarContainer.innerHTML = ''; // 초기화
            sidebarContainer.appendChild(title); // 제목은 유지
            sidebarContainer.appendChild(careerContent.cloneNode(true));
        }
    } catch (e) {
        console.error("약력을 불러오는 데 실패했습니다:", e);
    }
}