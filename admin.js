/**
 * admin.js
 * 기능: 데이터 로드, GitHub API 연동(추가/수정/삭제), 모달 제어
 */

let modal, btnOpen, btnCancel, btnNext, carForm;
let isEditMode = false; // 현재 모달이 수정 모드인지 확인
let editIndex = null;   // 수정 중인 데이터의 인덱스
let currentFullData = []; // 전체 데이터를 담을 배열

document.addEventListener('DOMContentLoaded', () => {
    modal = document.getElementById('modal-container');
    btnOpen = document.getElementById('btn-open-modal');
    btnCancel = document.getElementById('btn-cancel');
    btnNext = document.getElementById('btn-next');
    carForm = document.getElementById('car-form');

    // 1. 새로 만들기 버튼 (등록 모드)
    if (btnOpen) {
        btnOpen.onclick = () => {
            isEditMode = false;
            editIndex = null;
            carForm.reset();
            document.querySelector('.modal-header h3').innerText = "새 자동차 정보 입력";
            btnNext.innerText = "데이터 저장 및 커밋";
            modal.style.display = 'block';
        };
    }

    // 2. 취소 버튼
    if (btnCancel) {
        btnCancel.onclick = () => {
            modal.style.display = 'none';
        };
    }

    // 3. 저장 버튼
    if (btnNext) {
        btnNext.onclick = handleDataSubmission;
    }

    loadLocalData();
});

/**
 * 데이터 제출 처리 (등록/수정 공용)
 */
async function handleDataSubmission() {
    const name = document.getElementById('name').value;
    const year = document.getElementById('year').value;
    const brand = document.getElementById('brand').value;
    const type = document.getElementById('type').value;
    const fuel = document.getElementById('fuel').value;
    const size = document.getElementById('size').value;
    const price = document.getElementById('price').value;
    const experience = document.getElementById('experience').value;
    const today = new Date().toISOString().split('T')[0];

    if (!name || !year) {
        alert("자동차 이름과 연식은 필수입니다.");
        return;
    }

    const entry = { name, year, brand, type, fuel, size, price, experience, date: today };

    btnNext.disabled = true;
    btnNext.innerText = "GitHub 처리 중...";

    if (isEditMode && editIndex !== null) {
        // 수정 모드: 기존 데이터 배열에서 해당 인덱스 교체
        currentFullData[editIndex] = entry;
    } else {
        // 등록 모드: 배열에 추가
        currentFullData.push(entry);
    }

    await syncWithGitHub(`Update database: ${isEditMode ? 'Edit' : 'Add'} ${name}`, currentFullData);
    
    btnNext.disabled = false;
    btnNext.innerText = "데이터 저장 및 커밋";
}

/**
 * [수정] 특정 데이터를 클릭했을 때 모달을 열고 데이터를 채움
 */
function openEditModal(index) {
    isEditMode = true;
    editIndex = index;
    const data = currentFullData[index];

    // 폼에 기존 값 채우기
    document.getElementById('name').value = data.name;
    document.getElementById('year').value = data.year;
    document.getElementById('brand').value = data.brand;
    document.getElementById('type').value = data.type;
    document.getElementById('fuel').value = data.fuel;
    document.getElementById('size').value = data.size;
    document.getElementById('price').value = data.price;
    document.getElementById('experience').value = data.experience || "시승 센터";

    document.querySelector('.modal-header h3').innerText = "자동차 정보 수정";
    btnNext.innerText = "수정사항 저장";
    modal.style.display = 'block';
}

/**
 * [삭제] 특정 데이터를 배열에서 제거하고 깃허브에 반영
 */
async function deleteEntry(index) {
    if (!confirm(`'${currentFullData[index].name}' 데이터를 삭제하시겠습니까?`)) return;

    const deletedName = currentFullData[index].name;
    currentFullData.splice(index, 1); // 배열에서 삭제

    await syncWithGitHub(`Delete from database: ${deletedName}`, currentFullData);
}

/**
 * GitHub API와 실시간 동기화 (저장/수정/삭제 공용)
 */
async function syncWithGitHub(message, updatedList) {
    const GITHUB_TOKEN = localStorage.getItem("gh_token");
    const REPO_OWNER = "evening-min";
    const REPO_NAME = "evening-min.github.io";
    const FILE_PATH = "data.json";

    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        const res = await fetch(url, { headers: { "Authorization": `token ${GITHUB_TOKEN}` } });
        const fileData = await res.json();

        const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(updatedList, null, 2))));

        const putRes = await fetch(url, {
            method: "PUT",
            headers: { "Authorization": `token ${GITHUB_TOKEN}`, "Content-Type": "application/json" },
            body: JSON.stringify({ message, content: updatedContent, sha: fileData.sha })
        });

        if (putRes.ok) {
            alert("변경사항이 성공적으로 반영되었습니다!");
            modal.style.display = 'none';
            loadLocalData();
        }
    } catch (e) {
        alert("처리에 실패했습니다.");
    }
}

/**
 * 데이터 로드 및 테이블 렌더링
 */
function loadLocalData() {
    fetch('data.json?t=' + new Date().getTime()) // 캐시 방지
        .then(res => res.json())
        .then(data => {
            currentFullData = data;
            renderTable(data);
        });
}

/**
 * 테이블 렌더링 함수 (수정 및 삭제 기능 포함 버전)
 */
function renderTable(data) {
    const tbody = document.getElementById('db-body');
    if (!tbody) return;
    
    tbody.innerHTML = ''; 

    // 최신 데이터를 위로 올리고 싶다면 .reverse()를 사용하세요.
    const displayData = [...data].reverse();

    displayData.forEach((car, index) => {
        // 실제 데이터의 인덱스를 추적하기 위해 계산 (reverse 사용 시 필요)
        const actualIndex = data.length - 1 - index;
        
        const row = `<tr>
            <td class="clickable-name" onclick="openEditModal(${actualIndex})">
                📄 <strong>${car.name || '-'}</strong>
            </td>
            <td>${car.year || '-'}</td>
            <td>${car.brand || '-'}</td>
            <td>${car.type || '-'}</td>
            <td>${car.fuel || '-'}</td>
            <td>${car.size || '-'}</td>
            <td>${car.price || '0'}</td>
            <td>${car.experience || '-'}</td> <td>${car.date || '-'}</td>       <td>
                <button class="btn-delete" onclick="deleteEntry(${actualIndex})">삭제</button>
            </td>
        </tr>`;
        tbody.innerHTML += row;
    });
}