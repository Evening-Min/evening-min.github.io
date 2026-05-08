"use strict";

document.addEventListener('DOMContentLoaded', () => {
    loadMaintenanceData();
});

// 임시 데이터 (나중에 JSON 파일로 분리할 예정)
const dummyMaintenance = [
    { category: 'oil', date: '2025-05-10', mileage: 65400, item: '엔진오일 5W-20', cost: 55000, note: '필터 포함, 자가 정비' },
    { category: 'part', date: '2025-06-15', mileage: 67200, item: '에어컨 필터', cost: 12000, note: '초미세먼지 차단형' },
    { category: 'repair', date: '2025-08-20', mileage: 70100, item: '앞 타이어 2본 교체', cost: 185000, note: '한국타이어 키너지 EX' }
];

async function loadMaintenanceData() {
    // 실제 구현 시: const res = await fetch('maintenance.json');
    const data = dummyMaintenance; 
    renderTable(data);
    updateSummary(data);
}

function renderTable(data) {
    const tbody = document.getElementById('maintenance-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    data.forEach(log => {
        const row = document.createElement('tr');

        // 카테고리 배지 처리
        const categoryMap = { 
            oil: '오일류', part: '소모품', repair: '수리/교체', wash: '세차/외장' 
        };

        row.innerHTML = `
            <td><span class="badge category-${log.category}">${categoryMap[log.category]}</span></td>
            <td>${log.date}</td>
            <td>${log.mileage.toLocaleString()} km</td>
            <td><span class="clickable-item" onclick="searchItem('${log.item}')">${log.item}</span></td>
            <td><span class="cost-text">₩${log.cost.toLocaleString()}</span></td>
            <td style="color: #888; font-size: 0.85rem;">${log.note}</td>
        `;
        tbody.appendChild(row);
    });
}

function updateSummary(data) {
    if (data.length === 0) return;
    // 가장 최근 주행거리 표시
    const latest = Math.max(...data.map(d => d.mileage));
    document.getElementById('total-mileage').innerText = latest.toLocaleString();
}

/**
 * [CSP 3 핵심 준비] 항목 클릭 시 쇼핑 검색 실행 (추후 네이버 API 연동)
 */
function searchItem(itemName) {
    // 현재는 알림창으로 확인하지만, 나중에 여기서 API를 호출하게 됩니다.
    alert(`'${itemName}'의 최저가 정보를 가져오겠습니다 (네이버 쇼핑 API 연동 예정)`);
}