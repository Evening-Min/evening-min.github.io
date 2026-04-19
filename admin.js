/**
 * admin.js
 * 기능: 데이터 로드, 테이블 렌더링(1300px 대응), 수정/삭제, 에디터 이동
 */

let currentFullData = []; // 전체 자동차 데이터를 담는 배열
let modal, carForm;

document.addEventListener('DOMContentLoaded', () => {
    // HTML 요소 할당
    modal = document.getElementById('modal-container');
    const btnOpen = document.getElementById('btn-open-modal');
    const btnCancel = document.getElementById('btn-cancel');
    const btnSave = document.getElementById('btn-next');
    carForm = document.getElementById('car-form');

    // 1. 새 자동차 추가 모달 열기
    if (btnOpen) {
        btnOpen.onclick = () => {
            carForm.reset();
            document.querySelector('.modal-header h3').innerText = "자동차 정보 입력";
            modal.style.display = 'block';
        };
    }

    // 2. 모달 취소 버튼 (우측 정렬된 버튼 중 하나)
    if (btnCancel) {
        btnCancel.onclick = () => {
            if (confirm("입력 중인 내용이 저장되지 않습니다. 취소하시겠습니까?")) {
                modal.style.display = 'none';
            }
        };
    }

    // 3. 데이터 저장 버튼 (GitHub API 연동)
    if (btnSave) {
        btnSave.onclick = handleDataSubmission;
    }

    // 초기 데이터 로드
    loadLocalData();
});

/**
 * [핵심] 깃허브 저장소에서 data.json을 불러와 테이블에 뿌려주는 함수
 */
async function loadLocalData() {
    try {
        const res = await fetch('data.json?t=' + new Date().getTime()); // 캐시 방지
        if (!res.ok) throw new Error("데이터를 불러올 수 없습니다.");
        currentFullData = await res.json();
        renderTable(currentFullData);
    } catch (e) {
        console.error("로드 실패:", e);
    }
}

/**
 * [디자인] 테이블 렌더링 (1300px 너비에 최적화된 10개 열 구조)
 */
function renderTable(data) {
    const tbody = document.getElementById('db-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    // 최신 데이터를 위로 보여주기 위해 역순 출력
    const displayData = [...data].reverse();

    displayData.forEach((car, index) => {
        // 원본 배열에서의 실제 인덱스 계산
        const actualIndex = data.length - 1 - index;
        
        // 시승기 발행 여부에 따른 버튼 텍스트 변경
        const reviewBtnText = car.isPublished ? "📝 시승기 수정" : "➕ 시승기 작성";
        
        const row = `<tr>
            <td class="clickable-name" onclick="openEditModal(${actualIndex})">
                <strong>${car.name || '-'}</strong>
            </td>
            <td>${car.year || '-'}</td>
            <td>${car.brand || '-'}</td>
            <td>${car.type || '-'}</td>
            <td>${car.fuel || '-'}</td>
            <td>${car.size || '-'}</td>
            <td>${car.price || '0'}</td>
            <td>${car.experience || '-'}</td> <td>${car.date || '-'}</td>       <td class="admin-actions">
                <button class="btn-review" onclick="goToEditor(${actualIndex})">${reviewBtnText}</button>
                <button class="btn-delete" onclick="deleteEntry(${actualIndex})">삭제</button>
            </td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

/**
 * [동선] 에디터 페이지로 이동 (ID 파라미터 포함)
 */
function goToEditor(index) {
    location.href = `editor.html?id=${index}`;
}

/**
 * [편의] 가격 입력 시 쉼표(,) 자동 포맷팅
 */
function formatPrice(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    input.value = value ? parseInt(value).toLocaleString() : '';
}

/**
 * [데이터] 저장 로직 (GitHub API PUT)
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

    const newEntry = { name, year, brand, type, fuel, size, price, experience, date: today };
    
    // 버튼 비활성화
    const btnSave = document.getElementById('btn-next');
    btnSave.disabled = true;
    btnSave.innerText = "저장 중...";

    try {
        currentFullData.push(newEntry);
        await syncWithGitHub("Add new car to database", currentFullData);
        modal.style.display = 'none';
        carForm.reset();
        await loadLocalData();
    } catch (e) {
        alert("저장 실패: " + e.message);
    } finally {
        btnSave.disabled = false;
        btnSave.innerText = "저장";
    }
}

/**
 * [삭제] 특정 차량 데이터 삭제
 */
async function deleteEntry(index) {
    if (!confirm(`'${currentFullData[index].name}' 데이터를 삭제하시겠습니까?`)) return;

    const deletedName = currentFullData[index].name;
    currentFullData.splice(index, 1);

    await syncWithGitHub(`Delete car: ${deletedName}`, currentFullData);
    await loadLocalData();
}

/**
 * [통신] GitHub API를 이용한 파일 업데이트 공용 함수
 */
async function syncWithGitHub(message, updatedList) {
    const GITHUB_TOKEN = localStorage.getItem("gh_token");
    const REPO_OWNER = "evening-min";
    const REPO_NAME = "evening-min.github.io";
    const FILE_PATH = "data.json";

    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
    
    // SHA 값 획득
    const res = await fetch(url, { headers: { "Authorization": `token ${GITHUB_TOKEN}` } });
    const fileData = await res.json();

    // 한글 깨짐 방지 인코딩
    const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(updatedList, null, 2))));

    const putRes = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: message,
            content: updatedContent,
            sha: fileData.sha
        })
    });

    if (!putRes.ok) throw new Error("GitHub 업데이트 실패");
}