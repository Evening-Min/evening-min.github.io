/**
 * admin.js
 * 기능: 데이터 로드, 모달 제어, GitHub API를 이용한 data.json 자동 업데이트
 */

// 전역 변수 설정
let modal, btnOpen, btnCancel, btnNext, carForm;

document.addEventListener('DOMContentLoaded', () => {
    // HTML 요소 할당
    modal = document.getElementById('modal-container');
    btnOpen = document.getElementById('btn-open-modal');
    btnCancel = document.getElementById('btn-cancel');
    btnNext = document.getElementById('btn-next');
    carForm = document.getElementById('car-form');

    // 1. 모달 열기
    if (btnOpen) {
        btnOpen.onclick = () => {
            modal.style.display = 'block';
        };
    }

    // 2. 취소 버튼 (입력 내용 초기화 및 닫기)
    if (btnCancel) {
        btnCancel.onclick = () => {
            if (confirm("입력된 내용은 저장되지 않습니다. 취소하시겠습니까?")) {
                carForm.reset();
                modal.style.display = 'none';
            }
        };
    }

    // 3. 데이터 저장 버튼 이벤트 연결
    if (btnNext) {
        btnNext.onclick = handleDataSubmission;
    }

    // 초기 데이터 로드 (JSON 방식)
    loadLocalData();
});

/**
 * 차량 가격 쉼표(,) 포맷팅 함수
 */
function formatPrice(input) {
    let value = input.value.replace(/[^0-9]/g, '');
    if (value) {
        input.value = parseInt(value).toLocaleString();
    } else {
        input.value = '';
    }
}

/**
 * [핵심] 입력된 데이터를 수집하고 GitHub 저장 프로세스를 시작하는 함수
 */
async function handleDataSubmission() {
    // 폼 데이터 수집
    const name = document.getElementById('name').value;
    const year = document.getElementById('year').value;
    const brand = document.getElementById('brand').value;
    const type = document.getElementById('type').value;
    const fuel = document.getElementById('fuel').value;
    const size = document.getElementById('size').value;
    const price = document.getElementById('price').value;
    const experience = document.getElementById('experience').value; // 추가된 스키마
    
    // 작성 일자 자동 생성 (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    // 유효성 검사
    if (!name || !year) {
        alert("자동차 이름과 연식은 필수 입력 사항입니다.");
        return;
    }

    // 전송용 객체 생성
    const newEntry = {
        name: name,
        year: year,
        brand: brand,
        type: type,
        fuel: fuel,
        size: size,
        price: price,
        experience: experience, // 추가된 데이터
        date: today             // 추가된 데이터
    };

    // 버튼 비활성화 (중복 클릭 방지)
    btnNext.disabled = true;
    btnNext.innerText = "GitHub 저장 중...";

    // GitHub API 호출
    await saveToGitHub(newEntry);
    
    // 버튼 복구
    btnNext.disabled = false;
    btnNext.innerText = "데이터 저장 및 커밋";
}

/**
 * [자동화] GitHub API (PUT)를 사용하여 data.json을 실시간으로 업데이트
 */
async function saveToGitHub(newEntry) {
    const GITHUB_TOKEN = localStorage.getItem("gh_token");
    const REPO_OWNER = "evening-min"; 
    const REPO_NAME = "evening-min.github.io";
    const FILE_PATH = "data.json";

    if (!GITHUB_TOKEN) {
        alert("GitHub 토큰이 브라우저에 저장되어 있지 않습니다. 다시 로그인하여 토큰을 입력해 주세요.");
        return;
    }

    try {
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
        
        // 1. 기존 파일의 정보(내용 및 SHA) 가져오기
        const res = await fetch(url, {
            headers: { "Authorization": `token ${GITHUB_TOKEN}` }
        });
        
        if (!res.ok) throw new Error("기존 데이터를 불러오지 못했습니다.");
        
        const fileData = await res.json();
        
        // 2. Base64 디코딩 및 JSON 파싱 (한글 깨짐 방지 처리)
        const content = JSON.parse(decodeURIComponent(escape(atob(fileData.content))));
        
        // 3. 기존 배열에 새 데이터 추가
        content.push(newEntry);
        
        // 4. 다시 Base64로 인코딩 (한글 깨짐 방지 처리)
        const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

        // 5. GitHub API를 통해 파일 업데이트 요청
        const putRes = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: `Update database: Added ${newEntry.name} (${newEntry.date})`,
                content: updatedContent,
                sha: fileData.sha // 업데이트를 위해 반드시 필요
            })
        });

        if (putRes.ok) {
            alert("데이터가 성공적으로 깃허브에 저장되었습니다!");
            modal.style.display = 'none';
            carForm.reset();
            loadLocalData(); // 테이블 새로고침
        } else {
            const errorInfo = await putRes.json();
            throw new Error(errorInfo.message);
        }
    } catch (e) {
        console.error("저장 실패 상세:", e);
        alert(`저장 중 오류 발생: ${e.message}`);
    }
}

/**
 * 저장소의 data.json을 읽어와서 관리자 표에 렌더링
 */
function loadLocalData() {
    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error("data.json 파일을 읽을 수 없습니다.");
            return response.json();
        })
        .then(data => {
            renderTable(data);
        })
        .catch(error => {
            console.warn("데이터를 불러올 수 없습니다. 파일이 비어있거나 경로가 잘못되었습니다.", error);
            renderTable([]);
        });
}

/**
 * 테이블 생성 함수
 */
function renderTable(data) {
    const tbody = document.getElementById('db-body');
    if (!tbody) return;
    
    tbody.innerHTML = ''; 

    // 최신순으로 보여주기 위해 배열을 역순으로 출력 (선택 사항)
    const displayData = [...data].reverse();

    displayData.forEach(car => {
        const row = `<tr>
            <td>📄 <strong>${car.name || '-'}</strong></td>
            <td>${car.year || '-'}</td>
            <td>${car.brand || '-'}</td>
            <td>${car.type || '-'}</td>
            <td>${car.fuel || '-'}</td>
            <td>${car.size || '-'}</td>
            <td>${car.price || '0'}</td>
            <td>${car.experience || '-'}</td> <td>${car.date || '-'}</td>       </tr>`;
        tbody.innerHTML += row;
    });
}