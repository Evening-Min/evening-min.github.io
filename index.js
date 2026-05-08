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

async function loadBestMaintenanceItems() {
    try {
        const res = await fetch('maintenance.json?t=' + new Date().getTime());
        const data = await res.json();
        
        // 별점(rating)이 5점인 것 중 최신순 2~3개 추출
        const bestItems = data.filter(item => item.rating === 5).reverse().slice(0, 3);
        renderBestItems(bestItems);
    } catch (e) {
        console.error("정비 데이터 로드 실패:", e);
    }
}

/**
 * 정비 기록 중 별점 5점 아이템을 렌더링합니다.
 */
function renderBestItems(items) {
    const container = document.getElementById('best-items-container');
    if (!container) return;
    
    container.innerHTML = items.map((item, index) => {
        // [중요] maintenance.js의 openMaintModal은 데이터 배열과 인덱스를 인자로 받습니다.
        // 인덱스 페이지의 bestItems 배열을 전역으로 잠시 보관하거나, 데이터를 직접 넘기는 방식으로 처리합니다.
        const safeItem = encodeURIComponent(JSON.stringify(item));
        
        return `
        <article class="post-card" onclick="openIndexBestModal('${safeItem}')">
            <div class="card-content" style="padding: 20px;">
                <div class="card-meta">
                    <span>${item.date}</span>
                    <span>추천 부품</span>
                </div>
                <h3 class="card-title">⭐ ${item.item}</h3>
                <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">
                    ${item.review || "상세 정보를 확인해보세요."}
                </p>
            </div>
        </article>
    `}).join('');
}

/**
 * 인덱스 전용 모달 오픈 브릿지 함수
 */
window.openIndexBestModal = function(itemStr) {
    const item = JSON.parse(decodeURIComponent(itemStr));
    
    // maintenance.js의 로직을 그대로 수행합니다.
    document.getElementById('modal-item-name').innerText = item.item;
    document.getElementById('modal-star-rating').innerText = '⭐'.repeat(item.rating);
    document.getElementById('modal-user-review').innerText = `"${item.review || ''}"`;
    
    document.getElementById('maint-detail-modal').style.display = 'flex';
    
    // 네이버 쇼핑 API 호출 (maintenance.js에 있는 함수 호출)
    if (typeof fetchNaverShopping === 'function') {
        fetchNaverShopping(item.item);
    }
};

/**
 * about.html에서 경력 사항만 추출하여 인덱스 사이드바에 삽입합니다.
 */
async function importCareerFromAbout() {
    try {
        const response = await fetch('about.html');
        const htmlString = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        // about.html에서 .career-list 전체를 복사
        const careerContent = doc.querySelector('.career-list');
        const container = document.getElementById('sidebar-career-container');

        if (careerContent && container) {
            // 제목은 유지하고 내용물만 교체
            const title = container.querySelector('.section-title');
            container.innerHTML = ''; 
            if(title) container.appendChild(title);
            
            // 복사본을 넣으면서 클래스 이름을 명확히 유지
            container.appendChild(careerContent.cloneNode(true));
        }
    } catch (e) {
        console.error("약력 로드 실패:", e);
    }
}