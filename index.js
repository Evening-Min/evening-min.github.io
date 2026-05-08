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

// index.js의 renderBestItems 함수 수정
function renderBestItems(items) {
    const container = document.getElementById('best-items-container');
    if (!container) return;
    
    container.innerHTML = items.map((item, index) => {
        // [중요] maintenance.js의 openMaintModal을 쓰려면 
        // 전체 데이터 중 해당 아이템의 '인덱스'가 필요할 수 있습니다.
        // 여기서는 간단하게 item 데이터를 직접 전달하는 방식으로 설명할게요.
        
        return `
        <article class="post-card" onclick="openModalForBest('${encodeURIComponent(JSON.stringify(item))}')">
            <div class="card-content" style="padding: 20px;">
                <div class="card-meta">
                    <span>${item.date}</span>
                    <span>추천 부품</span>
                </div>
                <h3 class="card-title">⭐ ${item.item}</h3>
                <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">
                    ${item.review ? item.review : "강력 추천 아이템!"}
                </p>
            </div>
        </article>
    `}).join('');
}

// 인덱스 페이지 전용 모달 오픈 함수
window.openModalForBest = function(itemStr) {
    const item = JSON.parse(decodeURIComponent(itemStr));
    
    // maintenance.js에 정의된 요소들에 데이터 채우기
    document.getElementById('modal-item-title').innerText = item.item;
    document.getElementById('modal-item-info').innerText = `${item.date} | ${item.mileage.toLocaleString()} km`;
    document.getElementById('modal-item-review').innerHTML = `
        <div class="stars">${'⭐'.repeat(item.rating)}</div>
        <p>${item.review || ''}</p>
    `;
    
    document.getElementById('maint-modal').style.display = 'flex';
    
    // 네이버 쇼핑 API 호출 (이게 핵심!)
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