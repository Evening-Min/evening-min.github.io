/*
 * Name: Youngmin Jeon
 * Date: April 14, 2024
 * Section: IAB 6068
 * This is js for the administrator page.
 * It handles data management, including adding, editing, and deleting car entries, as well as syncing changes with GitHub.
 */

/*
 * Name: Youngmin Jeon
 * Date: May 8, 2026
 * Section: IAB 6068
 * This is js for the administrator page (Dual Mode: Car & Maintenance)
 */

let currentMode = 'car'; // 'car' 또는 'maint'

// 상태 및 데이터 변수
let currentFullData = []; 
let isEditMode = false; 
let editIndex = null;   

let currentMaintData = [];
let isMaintEditMode = false;
let editMaintIndex = null;

// DOM 요소
let modal, carForm;
let maintModal, maintForm;

document.addEventListener('DOMContentLoaded', () => {
    modal = document.getElementById('modal-container');
    carForm = document.getElementById('car-form');
    
    maintModal = document.getElementById('maintenance-modal-container');
    maintForm = document.getElementById('maint-form');

    // 탭 이벤트 리스너
    document.getElementById('tab-car').onclick = () => switchMode('car');
    document.getElementById('tab-maint').onclick = () => switchMode('maint');

    // 메인 추가 버튼
    document.getElementById('btn-open-modal').onclick = openAddModal;

    // 모달 닫기 버튼들
    document.getElementById('btn-cancel').onclick = () => modal.style.display = 'none';
    document.getElementById('btn-maint-cancel').onclick = () => maintModal.style.display = 'none';

    // 모달 저장 버튼들
    document.getElementById('btn-next').onclick = handleCarSubmission;
    document.getElementById('btn-maint-next').onclick = handleMaintSubmission;

    // 초기 모드 세팅 (시승기 관리)
    switchMode('car');
    
    // 별점 클릭 이벤트 등록
    initStarRating();
});

/**
 * 별점 시스템 초기화 (클릭 시 상태 업데이트)
 */
function initStarRating() {
    const stars = document.querySelectorAll('#maint-star-container span');
    const ratingInput = document.getElementById('maint-rating');

    stars.forEach(star => {
        star.addEventListener('click', () => {
            const val = parseInt(star.getAttribute('data-value'));
            setStarRating(val);
        });
    });
}

function setStarRating(val) {
    const stars = document.querySelectorAll('#maint-star-container span');
    const ratingInput = document.getElementById('maint-rating');
    
    ratingInput.value = val;
    stars.forEach(s => {
        const sVal = parseInt(s.getAttribute('data-value'));
        s.classList.toggle('active', sVal <= val);
    });
}

/**
 * [핵심] 탭 전환 엔진: 모드에 따라 UI와 데이터를 스왑합니다.
 */
function switchMode(mode) {
    currentMode = mode;
    const thead = document.getElementById('db-thead');
    const tbody = document.getElementById('db-body');
    const btnOpen = document.getElementById('btn-open-modal');
    
    // 탭 UI 변경
    document.getElementById('tab-car').classList.toggle('active', mode === 'car');
    document.getElementById('tab-maint').classList.toggle('active', mode === 'maint');

    tbody.innerHTML = ''; // 초기화

    if (mode === 'car') {
        btnOpen.innerText = "+ 새 자동차 추가하기";
        thead.innerHTML = `<tr>
            <th>🚘 자동차 이름</th><th>🔟 연식</th><th>⭐️ 브랜드</th><th>🚙 형식</th>
            <th>⛽️ 연료 종류</th><th>📏 크기</th><th>💵 가격</th><th>🗺️ 체험 경로</th><th>📅 등록일</th><th>⚙️ 관리</th>
        </tr>`;
        loadCarData();
    } else {
        btnOpen.innerText = "+ 정비 기록 추가하기";
        thead.innerHTML = `<tr>
            <th>📂 분류</th>
            <th>🔧 정비 내역</th>
            <th>📅 날짜</th>
            <th>📏 주행거리(km)</th>
            <th>💵 비용</th>
            <th>⚙️ 관리</th>
        </tr>`;
        loadMaintData();
    }
}

/**
 * 메인 추가 버튼 동작 분기
 */
function openAddModal() {
    if (currentMode === 'car') {
        isEditMode = false;
        editIndex = null;
        carForm.reset();
        document.querySelector('#modal-container .modal-header h3').innerText = "새 자동차 정보 입력";
        modal.style.display = 'block';
    } else {
        isMaintEditMode = false;
        editMaintIndex = null;
        maintForm.reset();
        // 날짜 기본값을 오늘로 설정
        document.getElementById('maint-date').value = new Date().toISOString().split('T')[0];
        document.querySelector('#maintenance-modal-container .modal-header h3').innerText = "새 정비 기록 입력";
        maintModal.style.display = 'block';
    }
}

// -------------------------------------------------------------
// [1] 시승기(Car) 관리 파트
// -------------------------------------------------------------
async function loadCarData() {
    try {
        const res = await fetch('data.json?t=' + new Date().getTime());
        if (!res.ok) throw new Error("데이터를 불러올 수 없습니다.");
        currentFullData = await res.json();
        renderCarTable(currentFullData);
    } catch (e) { console.error(e); }
}

function renderCarTable(data) {
    const tbody = document.getElementById('db-body');
    if (!tbody || currentMode !== 'car') return;
    
    tbody.innerHTML = '';
    const displayData = [...data].reverse();

    displayData.forEach((car, index) => {
        const actualIndex = data.length - 1 - index;
        const reviewBtnText = car.isPublished ? "📝 수정" : "➕ 시승기";
        
        tbody.innerHTML += `<tr>
            <td class="clickable-name" onclick="openCarEditModal(${actualIndex})"><strong>${car.name || '-'}</strong></td>
            <td>${car.year || '-'}</td><td>${car.brand || '-'}</td><td>${car.type || '-'}</td>
            <td>${car.fuel || '-'}</td><td>${car.size || '-'}</td><td>${car.price || '0'}</td>
            <td>${car.experience || '-'}</td><td>${car.date || '-'}</td>
            <td class="admin-actions">
                <button class="btn-review" onclick="location.href='editor.html?id=${actualIndex}'">${reviewBtnText}</button>
                <button class="btn-delete" onclick="deleteCarEntry(${actualIndex})">삭제</button>
            </td>
        </tr>`;
    });
}

function openCarEditModal(index) {
    isEditMode = true;
    editIndex = index;
    const car = currentFullData[index];
    document.getElementById('name').value = car.name || '';
    document.getElementById('year').value = car.year || '';
    document.getElementById('brand').value = car.brand || '';
    document.getElementById('type').value = car.type || 'Sedan';
    document.getElementById('fuel').value = car.fuel || 'Gasoline';
    document.getElementById('size').value = car.size || 'Compact';
    document.getElementById('price').value = car.price || '';
    document.getElementById('experience').value = car.experience || '본인/가족 차량';
    document.querySelector('#modal-container .modal-header h3').innerText = "자동차 정보 수정";
    modal.style.display = 'block';
}

async function handleCarSubmission() {
    const name = document.getElementById('name').value;
    const year = document.getElementById('year').value;
    if (!name || !year) return alert("이름과 연식은 필수입니다.");

    const entry = {
        name, year,
        brand: document.getElementById('brand').value,
        type: document.getElementById('type').value,
        fuel: document.getElementById('fuel').value,
        size: document.getElementById('size').value,
        price: document.getElementById('price').value,
        experience: document.getElementById('experience').value,
        date: new Date().toISOString().split('T')[0]
    };

    if (isEditMode) {
        const original = currentFullData[editIndex];
        entry.isPublished = original.isPublished || false;
        entry.reviewPath = original.reviewPath || "";
        entry.imageFolder = original.imageFolder || "";
        entry.postTitle = original.postTitle || "";
        currentFullData[editIndex] = entry;
    } else {
        entry.isPublished = false;
        entry.reviewPath = "";
        currentFullData.push(entry);
    }

    document.getElementById('btn-next').innerText = "저장 중...";
    await syncWithGitHub(`DB Update: Car ${name}`, currentFullData, "data.json");
    modal.style.display = 'none';
    document.getElementById('btn-next').innerText = "저장";
    loadCarData();
}

async function deleteCarEntry(index) {
    if (!confirm(`'${currentFullData[index].name}' 데이터를 삭제하시겠습니까?`)) return;
    currentFullData.splice(index, 1);
    await syncWithGitHub(`Delete car`, currentFullData, "data.json");
    loadCarData();
}

// -------------------------------------------------------------
// [2] 정비 기록(Maintenance) 관리 파트
// -------------------------------------------------------------
async function loadMaintData() {
    try {
        const res = await fetch('maintenance.json?t=' + new Date().getTime());
        if (!res.ok) {
            currentMaintData = []; // 파일이 없으면 빈 배열로 초기화
        } else {
            currentMaintData = await res.json();
        }
        renderMaintTable(currentMaintData);
    } catch (e) {
        currentMaintData = [];
        renderMaintTable(currentMaintData);
    }
}

function renderMaintTable(data) {
    const tbody = document.getElementById('db-body');
    if (!tbody || currentMode !== 'maint') return;
    
    tbody.innerHTML = '';
    const displayData = [...data].reverse();

    const catMap = { oil: '오일', part: '소모품', wash: '세차/외장', repair: '수리/교체' };

    displayData.forEach((log, index) => {
        const actualIndex = data.length - 1 - index;
        const starDisplay = '⭐'.repeat(log.rating || 0);

        tbody.innerHTML += `<tr>
            <td><span class="badge category-${log.category}">${catMap[log.category] || log.category}</span></td>
            <td class="clickable-name" onclick="openMaintEditModal(${actualIndex})">
                <strong>${log.item || '-'}</strong> ${starDisplay ? `<small style="margin-left:5px;">${starDisplay}</small>` : ''}
            </td>
            <td>${log.date || '-'}</td>
            <td>${Number(log.mileage).toLocaleString()} km</td>
            <td>₩${Number(log.cost).toLocaleString()}</td>
            <td class="admin-actions">
                <button class="btn-delete" onclick="deleteMaintEntry(${actualIndex})">삭제</button>
            </td>
        </tr>`;
    });
}

function openMaintEditModal(index) {
    isMaintEditMode = true;
    editMaintIndex = index;
    const log = currentMaintData[index];

    document.getElementById('maint-category').value = log.category || 'oil';
    document.getElementById('maint-date').value = log.date || '';
    document.getElementById('maint-mileage').value = log.mileage || '';
    document.getElementById('maint-cost').value = log.cost || '';
    document.getElementById('maint-item').value = log.item || '';
    document.getElementById('maint-note').value = log.note || '';
    setStarRating(log.rating || 0);
    document.getElementById('maint-review').value = log.review || '';
    
    document.querySelector('#maintenance-modal-container .modal-header h3').innerText = "정비 기록 수정";
    maintModal.style.display = 'block';
}

async function handleMaintSubmission() {
    const item = document.getElementById('maint-item').value;
    const mileage = document.getElementById('maint-mileage').value;
    if (!item || !mileage) return alert("정비 항목과 주행거리는 필수입니다.");

    const entry = {
        category: document.getElementById('maint-category').value,
        date: document.getElementById('maint-date').value,
        mileage: parseInt(mileage),
        item: item,
        cost: parseInt(document.getElementById('maint-cost').value.replace(/[^0-9]/g, '')) || 0,
        rating: parseInt(document.getElementById('maint-rating').value), // [신규]
        review: document.getElementById('maint-review').value,           // [신규]
        note: document.getElementById('maint-note').value
    };

    if (isMaintEditMode) {
        currentMaintData[editMaintIndex] = entry;
    } else {
        currentMaintData.push(entry);
    }

    await syncWithGitHub(`DB Update: Maint ${item}`, currentMaintData, "maintenance.json");
    maintModal.style.display = 'none';
    loadMaintData();
}

async function deleteMaintEntry(index) {
    if (!confirm(`'${currentMaintData[index].item}' 기록을 삭제하시겠습니까?`)) return;
    currentMaintData.splice(index, 1);
    await syncWithGitHub(`Delete maintenance record`, currentMaintData, "maintenance.json");
    loadMaintData();
}

// -------------------------------------------------------------
// [공통] 편의 기능 및 통신 모듈
// -------------------------------------------------------------
function formatPrice(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    input.value = value ? parseInt(value).toLocaleString() : '';
}

/**
 * GitHub API 파일 업데이트 공용 함수 (파일명 파라미터 추가)
 */
async function syncWithGitHub(message, updatedList, fileName = "data.json") {
    const GITHUB_TOKEN = localStorage.getItem("gh_token");
    const REPO_OWNER = "evening-min";
    const REPO_NAME = "evening-min.github.io";
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fileName}`;
    
    let sha;
    try {
        const getRes = await fetch(url, { headers: { "Authorization": `token ${GITHUB_TOKEN}` } });
        if (getRes.ok) {
            const fileData = await getRes.json();
            sha = fileData.sha;
        }
    } catch (e) {
        // 파일이 아직 존재하지 않는 경우 에러 무시 (새로 생성됨)
    }

    const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(updatedList, null, 2))));
    
    const bodyObj = { message: message, content: updatedContent };
    if (sha) bodyObj.sha = sha; // sha가 존재할 때만 추가 (파일 덮어쓰기)

    const putRes = await fetch(url, {
        method: "PUT",
        headers: { "Authorization": `token ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify(bodyObj)
    });

    if (!putRes.ok) throw new Error("GitHub 업데이트 실패");
}