/*
 * Name: Youngmin Jeon
 * Date: May 8, 2026
 * Section: IAB 6068
 * This is js for the maintenance page, including JSON fetch and Modal logic.
 */

"use strict";

let allMaintenanceData = [];

document.addEventListener('DOMContentLoaded', () => {
    fetchMaintenanceData();
});

/**
 * [CSP 3] maintenance.json 데이터를 가져옵니다.
 */
async function fetchMaintenanceData() {
    try {
        const res = await fetch('maintenance.json?t=' + new Date().getTime());
        if (!res.ok) throw new Error("데이터를 로드할 수 없습니다.");
        
        allMaintenanceData = await res.json();
        // 최신순 정렬
        allMaintenanceData.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        renderMaintenanceTable(allMaintenanceData);
        updateMileageSummary(allMaintenanceData);
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

/**
 * 테이블 렌더링 (순서: 분류 -> 항목 -> 날짜 -> 주행거리 -> 비용 -> 비고)
 */
function renderMaintenanceTable(data) {
    const tbody = document.getElementById('maintenance-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const catMap = { oil: '오일류', part: '소모품', wash: '세차/외장', repair: '수리/교체' };

    data.forEach((log, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="badge category-${log.category}">${catMap[log.category] || log.category}</span></td>
            <td><span class="clickable-item" onclick="openMaintModal(${index})">${log.item}</span></td>
            <td>${log.date}</td>
            <td>${Number(log.mileage).toLocaleString()} km</td>
            <td><span class="cost-text">₩${Number(log.cost).toLocaleString()}</span></td>
            <td style="color: #888; font-size: 0.85rem;">${log.note || ''}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateMileageSummary(data) {
    if (data.length === 0) return;
    const maxMileage = Math.max(...data.map(d => Number(d.mileage)));
    document.getElementById('total-mileage').innerText = maxMileage.toLocaleString();
}

/**
 * 모달 열기: 내 리뷰와 별점을 먼저 표시합니다.
 */
function openMaintModal(index) {
    const data = allMaintenanceData[index];
    const modal = document.getElementById('maint-detail-modal');
    
    // 1. 내 데이터 채우기
    document.getElementById('modal-item-name').innerText = data.item;
    document.getElementById('modal-star-rating').innerText = '⭐'.repeat(data.rating || 0);
    document.getElementById('modal-user-review').innerText = data.review || "작성된 리뷰가 없습니다.";
    
    // 2. 쇼핑 영역 초기화
    document.getElementById('shopping-result-container').innerHTML = '<p class="api-placeholder">쇼핑 정보를 불러오는 중입니다...</p>';
    
    modal.style.display = 'flex';

    // 3. 네이버 쇼핑 API 호출 실행 (다음 단계에서 구현)
    // fetchNaverShopping(data.item); 
}

function closeMaintModal() {
    document.getElementById('maint-detail-modal').style.display = 'none';
}

/**
 * [예정] 네이버 쇼핑 API 연동 함수 (비워둠)
 */
async function fetchNaverShopping(query) {
    // 여기에 Fetch API와 Naver Search API 로직이 들어갈 예정입니다.
    console.log(`${query} 검색을 시작합니다.`);
}